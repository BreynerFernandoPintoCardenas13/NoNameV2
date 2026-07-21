import "server-only";

import type { OpenProjectService } from "@/modules/openproject/services/openproject.service";
import type { TimeEntryListItem } from "@/modules/openproject/types";
import type { AdminFilters } from "@/modules/admin/types";
import { extractIdFromHref } from "@/modules/admin/utils/openproject-filters";

/**
 * Acceso de bajo nivel a `/api/v3/time_entries` (ver
 * ADMIN_ANALYTICS_PLAN.md §1.7). Horas REALES registradas — distintas de
 * `estimatedTime` en work packages. Sin agregación nativa: hay que traer y
 * sumar nosotros. Puede quedar vacío si el equipo no usa esta función de
 * OpenProject (§8, riesgo 3) — eso es un dato legítimo, no un error.
 *
 * El vocabulario de filtros es distinto al de `work_packages` (snake_case:
 * `spent_on`/`project_id`/`user_id`, ver §1.7) — no reutiliza
 * `buildWorkPackageFilters`, que traduce específicamente los filtros de esa
 * otra colección.
 */

export interface RawTimeEntry {
  hours: string; // duración ISO 8601, ej. "PT5H30M"
  userId: string;
  projectId: string;
  workPackageId: string | null;
  spentOn: string;
}

const PAGE_SIZE = 500;
// ponytail: tope defensivo (~5000 registros); un rango de fechas/proyecto/
// desarrollador filtrado en uso real queda muy por debajo de esto.
const MAX_PAGES = 10;

export async function listTimeEntries(
  service: OpenProjectService,
  filters: AdminFilters,
): Promise<RawTimeEntry[]> {
  const conditions: Record<string, { operator: string; values: string[] }>[] = [];
  if (filters.dateFrom && filters.dateTo) {
    conditions.push({ spent_on: { operator: "<>d", values: [filters.dateFrom, filters.dateTo] } });
  }
  if (filters.projectId) {
    conditions.push({ project_id: { operator: "=", values: [filters.projectId] } });
  }
  if (filters.developerId) {
    conditions.push({ user_id: { operator: "=", values: [filters.developerId] } });
  }
  const filtersParam = conditions.length > 0 ? JSON.stringify(conditions) : undefined;

  const elements: TimeEntryListItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { total, elements: batch } = await service.queryTimeEntries({
      filters: filtersParam,
      pageSize: PAGE_SIZE,
      offset: page,
    });
    elements.push(...batch);
    if (elements.length >= total || batch.length === 0) break;
  }

  return elements.map((entry) => ({
    hours: entry.hours,
    userId: extractIdFromHref(entry._links.user?.href) ?? "",
    projectId: extractIdFromHref(entry._links.project?.href) ?? "",
    workPackageId: extractIdFromHref(entry._links.workPackage?.href),
    spentOn: entry.spentOn,
  }));
}
