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

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Traduce `AdminFilters` a la lista de expresiones de `filters` (antes de
 * serializar). `rangeOverride` reemplaza el rango `dateFrom`/`dateTo` del
 * usuario por una ventana calculada (hoy/semana/mes, tendencia, período
 * anterior) — usado por `work-packages.repository.ts` para las ventanas
 * fijas del Dashboard General y la comparación contra el período anterior.
 */
export function buildWorkPackageFilters(
  filters: AdminFilters,
  rangeOverride?: { from: Date; to: Date },
): OpenProjectFilterExpression[] {
  const expressions: OpenProjectFilterExpression[] = [];

  if (rangeOverride) {
    // `<>d`: rango entre dos fechas ISO8601 (ver §1.1).
    expressions.push({
      createdAt: {
        operator: "<>d",
        values: [toDateOnly(rangeOverride.from), toDateOnly(rangeOverride.to)],
      },
    });
  } else if (filters.dateFrom && filters.dateTo) {
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

/** Construye y serializa en un paso — `undefined` si no hay ninguna condición (evita mandar `filters=[]`). */
export function buildWorkPackageFiltersParam(
  filters: AdminFilters,
  rangeOverride?: { from: Date; to: Date },
): string | undefined {
  const expressions = buildWorkPackageFilters(filters, rangeOverride);
  return expressions.length > 0 ? serializeOpenProjectFilters(expressions) : undefined;
}

/**
 * Extrae el ID de un href de recurso de OpenProject (`/api/v3/projects/123`
 * → `"123"`) — usado para resolver `_links.valueLink`/`_links.<campo>.href`
 * a IDs planos. `null` si no hay link (ej. ticket sin asignar).
 */
export function extractIdFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const match = /(\d+)\/?$/.exec(href);
  return match ? match[1] : null;
}
