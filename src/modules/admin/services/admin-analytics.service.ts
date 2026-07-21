import type {
  ActivityItem,
  AdminFilters,
  DashboardSummary,
  DeveloperRankingItem,
  TicketDistribution,
  TicketTrend,
  TimeSummary,
} from "@/modules/admin/types";
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_DEVELOPER_RANKING,
  MOCK_RECENT_ACTIVITY,
  MOCK_TICKETS_BY_PM,
  MOCK_TICKETS_BY_PROJECT,
  MOCK_TICKET_TREND,
  MOCK_TIME_SUMMARY,
} from "@/modules/admin/services/mock-admin-data";

/**
 * Orquestación cliente del panel — la API pública de este archivo (nombres
 * de función, parámetros, tipos de retorno) es el contrato estable entre
 * Fase 3 (mocks) y Fase 4 (Route Handlers reales bajo `app/api/admin/*`).
 * Hoy cada función ignora `filters` y devuelve el mock correspondiente; en
 * Fase 4 pasa a hacer `fetch` a su Route Handler enviando esos mismos
 * filtros — nada fuera de este archivo debería necesitar cambiar.
 *
 * SOLO este servicio (nunca los componentes/hooks) sabe de dónde vienen los
 * datos — mismo patrón que `modules/settings/services/settings.service.ts`.
 */

// Demora artificial para poder validar skeletons/estados de carga con mocks.
const MOCK_LATENCY_MS = 450;
function withLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export async function getDashboardSummary(filters: AdminFilters): Promise<DashboardSummary> {
  void filters; // se usará al construir la query real en Fase 4
  return withLatency(MOCK_DASHBOARD_SUMMARY);
}

export async function getTicketTrend(filters: AdminFilters): Promise<TicketTrend> {
  void filters;
  return withLatency(MOCK_TICKET_TREND);
}

export async function getTicketsByPm(filters: AdminFilters): Promise<TicketDistribution[]> {
  void filters;
  return withLatency(MOCK_TICKETS_BY_PM);
}

export async function getTicketsByProject(filters: AdminFilters): Promise<TicketDistribution[]> {
  void filters;
  return withLatency(MOCK_TICKETS_BY_PROJECT);
}

export async function getDeveloperRanking(filters: AdminFilters): Promise<DeveloperRankingItem[]> {
  void filters;
  return withLatency(MOCK_DEVELOPER_RANKING);
}

export async function getTimeSummary(filters: AdminFilters): Promise<TimeSummary> {
  void filters;
  return withLatency(MOCK_TIME_SUMMARY);
}

export async function getRecentActivity(filters: AdminFilters): Promise<ActivityItem[]> {
  void filters;
  return withLatency(MOCK_RECENT_ACTIVITY);
}
