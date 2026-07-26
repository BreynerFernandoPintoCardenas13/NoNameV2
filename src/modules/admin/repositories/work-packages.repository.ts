import "server-only";

import { logger } from "@/lib/logger";
import type { OpenProjectService } from "@/modules/openproject/services/openproject.service";
import type { WorkPackageCollection, WorkPackageListItem } from "@/modules/openproject/types";
import type {
  ActivityItem,
  AdminFilters,
  DeveloperRankingItem,
  TicketDistribution,
  TimeBreakdownEntry,
  TimeSummary,
  TicketTrend,
  TrendGranularity,
} from "@/modules/admin/types";
import { iso8601DurationToHours } from "@/modules/admin/utils/duration";
import {
  buildWorkPackageFiltersParam,
  extractIdFromHref,
} from "@/modules/admin/utils/openproject-filters";
import {
  bucketByGranularity,
  calculateVariation,
  getDayRange,
  getMonthRange,
  getWeekRange,
  previousPeriod,
} from "@/modules/admin/utils/date-buckets";

/**
 * Acceso de bajo nivel a `/api/v3/work_packages` (ver ADMIN_ANALYTICS_PLAN.md
 * §1.2/§3/§6). Fase 4: la lógica corre contra OpenProject real vía
 * `OpenProjectService` — ninguna función de este archivo cambió de firma de
 * retorno respecto a Fase 3.5 (solo se agregó `service` como primer
 * parámetro). Preferimos `groupBy`+`showSums` (agregación real del
 * servidor) siempre que el reporte encaje en una sola dimensión; solo
 * caemos a fetch-y-agregar donde la API genuinamente no ofrece otra cosa
 * (§0, §9, §11). SOLO servidor: nunca se importa desde
 * `services/admin-analytics.service.ts` (ese corre en el cliente).
 */

const TOP_N = 10;
const PAGE_SIZE = 200;
// ponytail: tope defensivo (~2000 filas) para los fetch-y-agrega (tendencia,
// ranking de desarrolladores) — el panel siempre acota por rango de fechas
// o filtros, así que en uso real no debería alcanzarse; si se alcanza, el
// reporte se trunca en vez de colgarse pidiendo miles de páginas.
const MAX_PAGES = 10;

async function fetchAllWorkPackages(
  service: OpenProjectService,
  filtersParam: string | undefined,
  options: { sortBy?: string; select?: string } = {},
): Promise<WorkPackageListItem[]> {
  const elements: WorkPackageListItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await service.queryWorkPackages({
      filters: filtersParam,
      sortBy: options.sortBy,
      select: options.select,
      pageSize: PAGE_SIZE,
      offset: page, // `offset` de OpenProject es el número de página (1-based), no un salto de filas — verificado en vivo.
    });
    const batch = result._embedded.elements ?? [];
    elements.push(...batch);
    if (elements.length >= result.total || batch.length === 0) break;
  }
  return elements;
}

/** Conteo barato vía `select=total` — nunca trae filas. */
async function countWorkPackages(
  service: OpenProjectService,
  filters: AdminFilters,
  range?: { from: Date; to: Date },
): Promise<number> {
  const filtersParam = buildWorkPackageFiltersParam(filters, range);
  const result = await service.queryWorkPackages({ filters: filtersParam, select: "total" });
  return result.total;
}

/** Conteo del período actual + del período anterior (misma duración) + variación %. */
async function countWorkPackagesWithVariation(
  service: OpenProjectService,
  filters: AdminFilters,
  range: { from: Date; to: Date },
): Promise<{ current: number; previous: number; changePercent: number | null }> {
  const previousRange = previousPeriod(range.from, range.to);
  const [current, previous] = await Promise.all([
    countWorkPackages(service, filters, range),
    countWorkPackages(service, filters, previousRange),
  ]);
  return { current, previous, changePercent: calculateVariation(current, previous) };
}

/**
 * Suma de `estimatedTime` vía `showSums=true` (sin `groupBy`) — `totalSums`
 * viene igual de barato que con `groupBy`, `pageSize: 1` minimiza el único
 * elemento completo que la API entrega junto a `totalSums` (no hay forma de
 * pedir `totalSums` con `select` sin también pedir `select=*`, verificado
 * en vivo: `select` restringe `totalSums` fuera de su whitelist top-level).
 */
async function sumEstimatedHours(
  service: OpenProjectService,
  filters: AdminFilters,
  range?: { from: Date; to: Date },
): Promise<number> {
  const filtersParam = buildWorkPackageFiltersParam(filters, range);
  const result = await service.queryWorkPackages({
    filters: filtersParam,
    showSums: true,
    pageSize: 1,
  });
  return iso8601DurationToHours(result.totalSums?.estimatedTime as string | null | undefined);
}

/**
 * Ejecuta una sub-consulta del resumen sin dejar que su fallo tumbe las
 * demás — la instancia real de OpenProject tiene un bug de servidor
 * confirmado (`InternalServerError`, "undefined method '[]' for nil:
 * NilClass") en ciertos rangos de fecha que tocan "hoy", inconsistente
 * según el operador/campo usado (`<>d`, `t`, `w`, todos probados en vivo).
 * No es un bug nuestro y no hay forma de evitarlo desde el cliente — se
 * degrada a `null` en vez de propagar el error y romper todo el Dashboard
 * General por una sola ventana temporal afectada.
 */
async function settleOrNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    logger.error("Sub-consulta del resumen del panel falló (se degrada a null):", error);
    return null;
  }
}

export interface FixedWindowCounts {
  today: number | null;
  week: { current: number; previous: number; changePercent: number | null } | null;
  month: { current: number; previous: number; changePercent: number | null } | null;
  estimatedHoursThisMonth: number | null;
}

/** Atajos de las tres ventanas fijas del Dashboard General, relativas a `now`. Resiliente por ventana (ver `settleOrNull`). */
export async function getFixedWindowCounts(
  service: OpenProjectService,
  filters: AdminFilters,
  now: Date = new Date(),
): Promise<FixedWindowCounts> {
  const dayRange = getDayRange(now);
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const [today, week, month, estimatedHoursThisMonth] = await Promise.all([
    settleOrNull(countWorkPackages(service, filters, dayRange)),
    settleOrNull(countWorkPackagesWithVariation(service, filters, weekRange)),
    settleOrNull(countWorkPackagesWithVariation(service, filters, monthRange)),
    settleOrNull(sumEstimatedHours(service, filters, monthRange)),
  ]);

  return { today, week, month, estimatedHoursThisMonth };
}

const DEFAULT_TREND_WINDOW_DAYS = 30;

/**
 * Rango/granularidad por defecto cuando el usuario no fijó un rango de
 * fechas: los últimos 30 días relativos a `now` (bucketeados por día).
 */
function resolveTrendWindow(
  filters: AdminFilters,
  now: Date,
): { range: { from: Date; to: Date }; granularity: TrendGranularity } {
  if (filters.dateFrom && filters.dateTo) {
    const from = new Date(filters.dateFrom);
    const to = new Date(new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000 - 1);
    const spanDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    const granularity: TrendGranularity =
      spanDays <= 31 ? "day" : spanDays <= 120 ? "week" : "month";
    return { range: { from, to }, granularity };
  }

  const to = new Date(now);
  const from = new Date(now.getTime() - DEFAULT_TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return { range: { from, to }, granularity: "day" };
}

/**
 * Tendencia bucketeada + comparación contra el período anterior (`groupBy`
 * no agrupa por fecha en OpenProject). `createdAt` no es un campo
 * seleccionable vía `select` en esta instancia (verificado en vivo — el
 * whitelist de `select` para `work_packages` no incluye fechas), así que
 * se traen elementos completos en vez de una proyección liviana.
 */
export async function getTicketTrend(
  service: OpenProjectService,
  filters: AdminFilters,
  now: Date = new Date(),
): Promise<TicketTrend> {
  const { range, granularity } = resolveTrendWindow(filters, now);
  const filtersParam = buildWorkPackageFiltersParam(filters, range);
  const previousRange = previousPeriod(range.from, range.to);

  const [current, previousCount] = await Promise.all([
    fetchAllWorkPackages(service, filtersParam),
    countWorkPackages(service, filters, previousRange),
  ]);

  const points = bucketByGranularity(
    current.filter((wp) => wp.createdAt).map((wp) => new Date(wp.createdAt as string)),
    granularity,
  );

  return {
    granularity,
    points,
    totalCurrentPeriod: current.length,
    totalPreviousPeriod: previousCount,
    changePercent: calculateVariation(current.length, previousCount) ?? 0,
  };
}

function hoursFromGroup(sums: Record<string, string | number | null> | undefined): number {
  return iso8601DurationToHours(sums?.estimatedTime as string | null | undefined);
}

/** `groupBy=<dimension>&showSums=true` — agregación real del servidor (única en toda la API). Top 10. */
export async function groupWorkPackagesBy(
  service: OpenProjectService,
  dimension: "project" | "assignee" | "responsible",
  filters: AdminFilters,
): Promise<TicketDistribution[]> {
  const filtersParam = buildWorkPackageFiltersParam(filters);
  const result = await service.queryWorkPackages({
    filters: filtersParam,
    groupBy: dimension,
    showSums: true,
  });

  return (result.groups ?? [])
    .filter((group) => group.value !== null) // descarta "sin asignar"/"sin proyecto"
    .map((group) => ({
      groupId: extractIdFromHref(group._links?.valueLink?.[0]?.href) ?? String(group.value),
      groupName: String(group.value),
      ticketCount: group.count,
      estimatedHours: Math.round(hoursFromGroup(group.sums) * 10) / 10,
    }))
    .sort((a, b) => b.ticketCount - a.ticketCount)
    .slice(0, TOP_N);
}

/**
 * Ranking de desarrolladores con sus 4 métricas. "Tickets"/"horas" salen de
 * `groupBy=assignee&showSums=true` (barato, 1 request); "más proyectos" y
 * "carga" exigen el cruce assignee×project, que no tiene `groupBy` de dos
 * dimensiones (ver §9) — se resuelve con un fetch proyectado adicional
 * (`select` reducido a `id`/`assignee`/`project`, sin descripción) y un
 * dedupe por `Set` en memoria. Los dos requests corren en paralelo.
 */
export async function getDeveloperRanking(
  service: OpenProjectService,
  filters: AdminFilters,
): Promise<DeveloperRankingItem[]> {
  const filtersParam = buildWorkPackageFiltersParam(filters);

  const [grouped, rows] = await Promise.all([
    service.queryWorkPackages({ filters: filtersParam, groupBy: "assignee", showSums: true }),
    fetchAllWorkPackages(service, filtersParam, {
      select: "total,elements/id,elements/assignee,elements/project",
    }),
  ]);

  const projectsByAssignee = new Map<string, Set<string>>();
  for (const wp of rows) {
    const assigneeId = extractIdFromHref(wp._links.assignee?.href);
    const projectId = extractIdFromHref(wp._links.project?.href);
    if (!assigneeId || !projectId) continue;
    const set = projectsByAssignee.get(assigneeId) ?? new Set<string>();
    set.add(projectId);
    projectsByAssignee.set(assigneeId, set);
  }

  return (grouped.groups ?? [])
    .filter((group) => group.value !== null)
    .map((group) => {
      const id = extractIdFromHref(group._links?.valueLink?.[0]?.href) ?? String(group.value);
      const estimatedHours = Math.round(hoursFromGroup(group.sums) * 10) / 10;
      return {
        id,
        name: String(group.value),
        ticketCount: group.count,
        estimatedHours,
        projectCount: projectsByAssignee.get(id)?.size ?? 0,
        // "Carga" es una métrica compuesta nuestra, no un concepto de OpenProject
        // (ver §12): tickets pendientes de completar pesan más que las horas solas.
        workload: Math.round(group.count * 1.5 + estimatedHours * 0.5),
      };
    })
    .sort((a, b) => b.workload - a.workload)
    .slice(0, TOP_N);
}

/**
 * Horas por proyecto/desarrollador/PM + promedios, vía 3 `groupBy`+`showSums`
 * en paralelo (una dimensión cada uno, agregación real del servidor) más un
 * cuarto request sin `groupBy` para los totales generales.
 */
export async function getTimeSummary(
  service: OpenProjectService,
  filters: AdminFilters,
): Promise<TimeSummary> {
  const filtersParam = buildWorkPackageFiltersParam(filters);

  const [byProjectRaw, byDeveloperRaw, byPmRaw, overall] = await Promise.all([
    service.queryWorkPackages({ filters: filtersParam, groupBy: "project", showSums: true }),
    service.queryWorkPackages({ filters: filtersParam, groupBy: "assignee", showSums: true }),
    service.queryWorkPackages({ filters: filtersParam, groupBy: "responsible", showSums: true }),
    service.queryWorkPackages({ filters: filtersParam, showSums: true, pageSize: 1 }),
  ]);

  const toEntries = (collection: WorkPackageCollection): TimeBreakdownEntry[] =>
    (collection.groups ?? [])
      .filter((group) => group.value !== null)
      .map((group) => {
        const hours = hoursFromGroup(group.sums);
        return {
          groupId: extractIdFromHref(group._links?.valueLink?.[0]?.href) ?? String(group.value),
          groupName: String(group.value),
          estimatedHours: Math.round(hours * 10) / 10,
          averageHoursPerTicket: group.count > 0 ? Math.round((hours / group.count) * 10) / 10 : 0,
        };
      })
      .sort((a, b) => b.estimatedHours - a.estimatedHours);

  const totalHours = hoursFromGroup(overall.totalSums);
  const totalCount = overall.total;
  const distinctProjects = (byProjectRaw.groups ?? []).filter(
    (group) => group.value !== null,
  ).length;

  return {
    byProject: toEntries(byProjectRaw),
    byDeveloper: toEntries(byDeveloperRaw),
    byPm: toEntries(byPmRaw),
    averageHoursPerTicket: totalCount > 0 ? Math.round((totalHours / totalCount) * 10) / 10 : 0,
    averageHoursPerProject:
      distinctProjects > 0 ? Math.round((totalHours / distinctProjects) * 10) / 10 : 0,
  };
}

/**
 * Tickets actualizados recientemente — no un log de auditoría (ver §8,
 * riesgo 5: `activities` no ofrece un feed global). `pageSize: TOP_N` con
 * `sortBy=[[updatedAt,desc]]` trae exactamente lo que hace falta en un
 * único request, sin `select` (igual que en `getTicketTrend`, `updatedAt`
 * no es seleccionable en esta instancia).
 */
export async function listRecentlyUpdatedWorkPackages(
  service: OpenProjectService,
  filters: AdminFilters,
): Promise<ActivityItem[]> {
  const filtersParam = buildWorkPackageFiltersParam(filters);
  const result = await service.queryWorkPackages({
    filters: filtersParam,
    sortBy: JSON.stringify([["updatedAt", "desc"]]),
    pageSize: TOP_N,
  });

  return (result._embedded.elements ?? []).map((wp) => ({
    id: String(wp.id),
    ticketId: String(wp.id),
    ticketSubject: wp.subject,
    projectName: wp._links.project?.title ?? "—",
    // "Responsable" (columna de la tabla) = quién ejecuta el ticket → assignee.
    // "PM" = el campo `responsible` de OpenProject (ver ADMIN_ANALYTICS_PLAN.md
    // §14: "PM → filtro responsible") — dos cosas distintas, mismo nombre en la API.
    responsibleName: wp._links.assignee?.title ?? null,
    pmName: wp._links.responsible?.title ?? null,
    updatedAt: wp.updatedAt ?? "",
  }));
}
