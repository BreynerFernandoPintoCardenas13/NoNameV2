import type { AdminFilters } from "@/modules/admin/types";

/**
 * Construcción del JSON de `filters` que espera la API v3 de OpenProject a
 * partir de `AdminFilters` (ver ADMIN_ANALYTICS_PLAN.md §1.1/§6/§14).
 * SOLO construye — no hace ninguna petición de red. Único lugar del módulo
 * que traduce filtros de la app al formato de OpenProject, para que todos
 * los repositories reutilicen la misma serialización.
 */

interface OpenProjectFilterCondition {
  operator: string;
  values: string[];
}

export type OpenProjectFilterExpression = Record<string, OpenProjectFilterCondition>;

/** Traduce `AdminFilters` a la lista de expresiones de `filters` (antes de serializar). */
export function buildWorkPackageFilters(filters: AdminFilters): OpenProjectFilterExpression[] {
  const expressions: OpenProjectFilterExpression[] = [];

  if (filters.dateFrom && filters.dateTo) {
    // `<>d`: rango entre dos fechas ISO8601 (ver §1.1).
    expressions.push({
      createdAt: { operator: "<>d", values: [filters.dateFrom, filters.dateTo] },
    });
  }
  if (filters.projectId) {
    expressions.push({ project: { operator: "=", values: [filters.projectId] } });
  }
  if (filters.pmId) {
    expressions.push({ responsible: { operator: "=", values: [filters.pmId] } });
  }
  if (filters.developerId) {
    expressions.push({ assignee: { operator: "=", values: [filters.developerId] } });
  }
  if (filters.userId) {
    expressions.push({ author: { operator: "=", values: [filters.userId] } });
  }
  if (filters.ticketType) {
    expressions.push({ type: { operator: "=", values: [filters.ticketType] } });
  }

  return expressions;
}

/** Serializa las expresiones al string JSON que espera el parámetro `filters` de la URL. */
export function serializeOpenProjectFilters(expressions: OpenProjectFilterExpression[]): string {
  return JSON.stringify(expressions);
}
