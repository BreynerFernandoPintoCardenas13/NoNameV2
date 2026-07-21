import "server-only";

import type { AdminFilters, TicketDistribution } from "@/modules/admin/types";

/**
 * Acceso de bajo nivel a `/api/v3/work_packages` (ver ADMIN_ANALYTICS_PLAN.md
 * §1.2/§3). Fase 3: solo define la interfaz pública que usarán los Route
 * Handlers en Fase 4 — construye sus filtros con
 * `utils/openproject-filters.ts`, pero todavía no llama a OpenProject.
 * SOLO servidor: nunca se importa desde `services/admin-analytics.service.ts`
 * (ese corre en el cliente).
 */

/** Fila cruda de un work package recién actualizado, antes de resolverse a `ActivityItem`. */
export interface RawWorkPackageActivity {
  id: string;
  subject: string;
  projectId: string;
  assigneeId: string | null;
  responsibleId: string | null;
  updatedAt: string;
}

export async function countWorkPackages(filters: AdminFilters): Promise<number> {
  void filters; // firma definida para Fase 4; el cuerpo llega con la integración real
  throw new Error("Not implemented");
}

export async function sumEstimatedHours(filters: AdminFilters): Promise<number> {
  void filters;
  throw new Error("Not implemented");
}

/** Fechas de creación crudas dentro del rango de `filters`, para bucketing (ver utils/date-buckets.ts). */
export async function listWorkPackageCreatedDates(filters: AdminFilters): Promise<string[]> {
  void filters;
  throw new Error("Not implemented");
}

/** `groupBy=<dimension>&showSums=true` — agregación real del servidor (única en toda la API). */
export async function groupWorkPackagesBy(
  dimension: "project" | "assignee" | "responsible",
  filters: AdminFilters,
): Promise<TicketDistribution[]> {
  void dimension;
  void filters;
  throw new Error("Not implemented");
}

export async function listRecentlyUpdatedWorkPackages(
  filters: AdminFilters,
): Promise<RawWorkPackageActivity[]> {
  void filters;
  throw new Error("Not implemented");
}
