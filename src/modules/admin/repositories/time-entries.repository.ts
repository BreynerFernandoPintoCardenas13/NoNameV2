import "server-only";

import { MOCK_TIME_ENTRIES } from "@/modules/admin/services/mock-admin-data";
import type { AdminFilters } from "@/modules/admin/types";

/**
 * Acceso de bajo nivel a `/api/v3/time_entries` (ver
 * ADMIN_ANALYTICS_PLAN.md §1.7). Horas REALES registradas — distintas de
 * `estimatedTime` en work packages. Sin agregación nativa: hay que traer y
 * sumar nosotros. Puede quedar vacío si el equipo no usa esta función de
 * OpenProject (ver §8, riesgo 3) — eso es un dato legítimo, no un error.
 */

export interface RawTimeEntry {
  hours: string; // duración ISO 8601, ej. "PT5H30M"
  userId: string;
  projectId: string;
  workPackageId: string | null;
  spentOn: string;
}

export async function listTimeEntries(filters: AdminFilters): Promise<RawTimeEntry[]> {
  return MOCK_TIME_ENTRIES.filter((entry) => {
    if (filters.dateFrom && entry.spentOn < filters.dateFrom) return false;
    if (filters.dateTo && entry.spentOn > filters.dateTo) return false;
    if (filters.projectId && entry.projectId !== filters.projectId) return false;
    if (filters.developerId && entry.userId !== filters.developerId) return false;
    return true;
  });
}
