import "server-only";

import {
  MOCK_TODAY,
  MOCK_WORK_PACKAGES,
  type MockWorkPackage,
} from "@/modules/admin/services/mock-admin-data";
import type {
  ActivityItem,
  AdminFilters,
  DeveloperRankingItem,
  TicketDistribution,
  TicketTrend,
  TimeSummary,
  TrendGranularity,
} from "@/modules/admin/types";
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
 * §1.2/§3). Fase 3.5: la lógica es real (filtrar/agrupar/sumar/ordenar/top 10
 * /variación %) pero corre sobre `MOCK_WORK_PACKAGES` en vez de una llamada a
 * OpenProject — en Fase 4 solo cambia de dónde sale la lista base, ninguna
 * de las funciones de este archivo cambia de firma ni de forma de retorno.
 * SOLO servidor: nunca se importa desde `services/admin-analytics.service.ts`
 * (ese corre en el cliente).
 */

const TOP_N = 10;

function matchesFilters(
  wp: MockWorkPackage,
  filters: AdminFilters,
  range?: { from: Date; to: Date },
) {
  if (range) {
    const createdAt = new Date(wp.createdAt).getTime();
    if (createdAt < range.from.getTime() || createdAt > range.to.getTime()) return false;
  } else if (filters.dateFrom && filters.dateTo) {
    const createdAt = new Date(wp.createdAt).getTime();
    const from = new Date(filters.dateFrom).getTime();
    const to = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
    if (createdAt < from || createdAt > to) return false;
  }
  if (filters.projectId && wp.projectId !== filters.projectId) return false;
  if (filters.pmId && wp.responsibleId !== filters.pmId) return false;
  if (filters.developerId && wp.assigneeId !== filters.developerId) return false;
  if (filters.userId && wp.authorId !== filters.userId) return false;
  if (filters.ticketType && wp.type !== filters.ticketType) return false;
  return true;
}

function selectWorkPackages(
  filters: AdminFilters,
  range?: { from: Date; to: Date },
): MockWorkPackage[] {
  return MOCK_WORK_PACKAGES.filter((wp) => matchesFilters(wp, filters, range));
}

export async function countWorkPackages(
  filters: AdminFilters,
  range?: { from: Date; to: Date },
): Promise<number> {
  return selectWorkPackages(filters, range).length;
}

export async function sumEstimatedHours(
  filters: AdminFilters,
  range?: { from: Date; to: Date },
): Promise<number> {
  return selectWorkPackages(filters, range).reduce((sum, wp) => sum + wp.estimatedHours, 0);
}

/** Conteo del período actual + del período anterior (misma duración) + variación %. */
export async function countWorkPackagesWithVariation(
  filters: AdminFilters,
  range: { from: Date; to: Date },
): Promise<{ current: number; previous: number; changePercent: number | null }> {
  const current = await countWorkPackages(filters, range);
  const previousRange = previousPeriod(range.from, range.to);
  const previous = await countWorkPackages(filters, previousRange);
  return { current, previous, changePercent: calculateVariation(current, previous) };
}

/** Atajos de las tres ventanas fijas del Dashboard General, relativas a `now`. */
export async function getFixedWindowCounts(
  filters: AdminFilters,
  now: Date = MOCK_TODAY,
): Promise<{
  today: number;
  week: { current: number; previous: number; changePercent: number | null };
  month: { current: number; previous: number; changePercent: number | null };
  estimatedHoursThisMonth: number;
}> {
  const dayRange = getDayRange(now);
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const [today, week, month, estimatedHoursThisMonth] = await Promise.all([
    countWorkPackages(filters, dayRange),
    countWorkPackagesWithVariation(filters, weekRange),
    countWorkPackagesWithVariation(filters, monthRange),
    sumEstimatedHours(filters, monthRange),
  ]);

  return { today, week, month, estimatedHoursThisMonth };
}

const DEFAULT_TREND_WINDOW_DAYS = 30;

/**
 * Rango/granularidad por defecto cuando el usuario no fijó un rango de
 * fechas: los últimos 30 días relativos a `now` (bucketeados por día). Esta
 * decisión vive aquí (no en el Route Handler) porque depende de qué "ahora"
 * usar — el repositorio mock usa `MOCK_TODAY`, Fase 4 usará `new Date()`.
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

/** Tendencia bucketeada + comparación contra el período anterior (`groupBy` no agrupa por fecha en OpenProject). */
export async function getTicketTrend(
  filters: AdminFilters,
  now: Date = MOCK_TODAY,
): Promise<TicketTrend> {
  const { range, granularity } = resolveTrendWindow(filters, now);
  const current = selectWorkPackages(filters, range);
  const previousRange = previousPeriod(range.from, range.to);
  const previousCount = await countWorkPackages(filters, previousRange);

  const points = bucketByGranularity(
    current.map((wp) => new Date(wp.createdAt)),
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

/** `groupBy=<dimension>&showSums=true` — agregación real del servidor (única en toda la API). Top 10. */
export async function groupWorkPackagesBy(
  dimension: "project" | "assignee" | "responsible",
  filters: AdminFilters,
): Promise<TicketDistribution[]> {
  const selected = selectWorkPackages(filters);
  const groups = new Map<string, { name: string; ticketCount: number; estimatedHours: number }>();

  for (const wp of selected) {
    const groupId =
      dimension === "project"
        ? wp.projectId
        : dimension === "assignee"
          ? wp.assigneeId
          : wp.responsibleId;
    const groupName =
      dimension === "project"
        ? wp.projectName
        : dimension === "assignee"
          ? wp.assigneeName
          : wp.responsibleName;

    const entry = groups.get(groupId) ?? { name: groupName, ticketCount: 0, estimatedHours: 0 };
    entry.ticketCount += 1;
    entry.estimatedHours += wp.estimatedHours;
    groups.set(groupId, entry);
  }

  return [...groups.entries()]
    .map(([groupId, entry]) => ({
      groupId,
      groupName: entry.name,
      ticketCount: entry.ticketCount,
      estimatedHours: Math.round(entry.estimatedHours * 10) / 10,
    }))
    .sort((a, b) => b.ticketCount - a.ticketCount)
    .slice(0, TOP_N);
}

/**
 * Ranking de desarrolladores con sus 4 métricas. "Más proyectos" y "carga"
 * son el único cruce genuinamente caro de los reportes pedidos (ver
 * ADMIN_ANALYTICS_PLAN.md §9): no hay `groupBy` de dos dimensiones, así que
 * se cuenta el set de proyectos distintos por desarrollador a mano.
 */
export async function getDeveloperRanking(filters: AdminFilters): Promise<DeveloperRankingItem[]> {
  const selected = selectWorkPackages(filters);
  const byDeveloper = new Map<
    string,
    { name: string; ticketCount: number; estimatedHours: number; projectIds: Set<string> }
  >();

  for (const wp of selected) {
    const entry = byDeveloper.get(wp.assigneeId) ?? {
      name: wp.assigneeName,
      ticketCount: 0,
      estimatedHours: 0,
      projectIds: new Set<string>(),
    };
    entry.ticketCount += 1;
    entry.estimatedHours += wp.estimatedHours;
    entry.projectIds.add(wp.projectId);
    byDeveloper.set(wp.assigneeId, entry);
  }

  return [...byDeveloper.entries()]
    .map(([id, entry]) => ({
      id,
      name: entry.name,
      ticketCount: entry.ticketCount,
      estimatedHours: Math.round(entry.estimatedHours * 10) / 10,
      projectCount: entry.projectIds.size,
      // "Carga" es una métrica compuesta nuestra, no un concepto de OpenProject
      // (ver §12): tickets pendientes de completar pesan más que las horas solas.
      workload: Math.round(entry.ticketCount * 1.5 + entry.estimatedHours * 0.5),
    }))
    .sort((a, b) => b.workload - a.workload)
    .slice(0, TOP_N);
}

/** Horas por proyecto/desarrollador/PM + promedios (ver §12: "Promedios" se calculan aquí, no en OpenProject). */
export async function getTimeSummary(filters: AdminFilters): Promise<TimeSummary> {
  const selected = selectWorkPackages(filters);

  const summarize = (
    keyOf: (wp: MockWorkPackage) => string,
    nameOf: (wp: MockWorkPackage) => string,
  ) => {
    const groups = new Map<string, { name: string; hours: number; count: number }>();
    for (const wp of selected) {
      const key = keyOf(wp);
      const entry = groups.get(key) ?? { name: nameOf(wp), hours: 0, count: 0 };
      entry.hours += wp.estimatedHours;
      entry.count += 1;
      groups.set(key, entry);
    }
    return [...groups.entries()]
      .map(([groupId, entry]) => ({
        groupId,
        groupName: entry.name,
        estimatedHours: Math.round(entry.hours * 10) / 10,
        averageHoursPerTicket:
          entry.count > 0 ? Math.round((entry.hours / entry.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.estimatedHours - a.estimatedHours);
  };

  const byProject = summarize(
    (wp) => wp.projectId,
    (wp) => wp.projectName,
  );
  const byDeveloper = summarize(
    (wp) => wp.assigneeId,
    (wp) => wp.assigneeName,
  );
  const byPm = summarize(
    (wp) => wp.responsibleId,
    (wp) => wp.responsibleName,
  );

  const totalHours = selected.reduce((sum, wp) => sum + wp.estimatedHours, 0);
  const distinctProjects = new Set(selected.map((wp) => wp.projectId)).size;

  return {
    byProject,
    byDeveloper,
    byPm,
    averageHoursPerTicket:
      selected.length > 0 ? Math.round((totalHours / selected.length) * 10) / 10 : 0,
    averageHoursPerProject:
      distinctProjects > 0 ? Math.round((totalHours / distinctProjects) * 10) / 10 : 0,
  };
}

/**
 * Tickets actualizados recientemente — no un log de auditoría (ver §8,
 * riesgo 5: `activities` no ofrece un feed global). Nombres ya resueltos
 * (`assigneeName`/`responsibleName`) porque OpenProject embebe el `title`
 * en cada `_links` de un work package, sin necesitar una consulta aparte.
 */
export async function listRecentlyUpdatedWorkPackages(
  filters: AdminFilters,
): Promise<ActivityItem[]> {
  return selectWorkPackages(filters)
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, TOP_N)
    .map((wp) => ({
      id: wp.id,
      ticketId: wp.id,
      // "Responsable" (columna de la tabla) = quién ejecuta el ticket → assignee.
      // "PM" = el campo `responsible` de OpenProject (ver ADMIN_ANALYTICS_PLAN.md
      // §14: "PM → filtro responsible") — dos cosas distintas, mismo nombre en la API.
      ticketSubject: wp.subject,
      projectName: wp.projectName,
      responsibleName: wp.assigneeName,
      pmName: wp.responsibleName,
      updatedAt: wp.updatedAt,
    }));
}
