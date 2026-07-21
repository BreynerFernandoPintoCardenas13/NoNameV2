import type {
  ActivityItem,
  AdminFilterOptions,
  AdminFilters,
  DashboardSummary,
  DeveloperRankingItem,
  TicketDistribution,
  TicketTrend,
  TimeSummary,
} from "@/modules/admin/types";

/**
 * Orquestación cliente del panel — la API pública de este archivo (nombres
 * de función, parámetros, tipos de retorno) es el contrato estable entre
 * Fase 3 (mocks directos) y Fase 3.5 (mocks vía Route Handler bajo
 * `app/api/admin/*`) y seguirá siéndolo en Fase 4 (OpenProject real): nada
 * fuera de este archivo debería necesitar cambiar cuando eso ocurra.
 *
 * SOLO este servicio (nunca los componentes/hooks) sabe cómo se piden los
 * datos — mismo patrón que `modules/settings/services/settings.service.ts`.
 */

/** Serializa `AdminFilters` como querystring, omitiendo los campos vacíos. */
function toSearchParams(filters: AdminFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchAdminReport<T>(path: string, filters: AdminFilters): Promise<T> {
  const res = await fetch(`/api/admin/${path}${toSearchParams(filters)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? "No se pudo cargar el reporte.");
  }
  return body as T;
}

export async function getDashboardSummary(filters: AdminFilters): Promise<DashboardSummary> {
  return fetchAdminReport<DashboardSummary>("summary", filters);
}

export async function getTicketTrend(filters: AdminFilters): Promise<TicketTrend> {
  return fetchAdminReport<TicketTrend>("trend", filters);
}

export async function getTicketsByPm(filters: AdminFilters): Promise<TicketDistribution[]> {
  return fetchAdminReport<TicketDistribution[]>("tickets-by-pm", filters);
}

export async function getTicketsByProject(filters: AdminFilters): Promise<TicketDistribution[]> {
  return fetchAdminReport<TicketDistribution[]>("tickets-by-project", filters);
}

export async function getDeveloperRanking(filters: AdminFilters): Promise<DeveloperRankingItem[]> {
  return fetchAdminReport<DeveloperRankingItem[]>("developer-ranking", filters);
}

export async function getTimeSummary(filters: AdminFilters): Promise<TimeSummary> {
  return fetchAdminReport<TimeSummary>("time-breakdown", filters);
}

export async function getRecentActivity(filters: AdminFilters): Promise<ActivityItem[]> {
  return fetchAdminReport<ActivityItem[]>("recent-activity", filters);
}

/** Opciones de `FilterBar` (proyectos/usuarios/desarrolladores) — no depende de los filtros actuales. */
export async function getFilterOptions(): Promise<AdminFilterOptions> {
  const res = await fetch("/api/admin/filter-options");
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ?? "No se pudieron cargar las opciones de filtro.",
    );
  }
  return body as AdminFilterOptions;
}
