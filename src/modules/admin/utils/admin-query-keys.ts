import type { AdminFilters } from "@/modules/admin/types";

/**
 * Fábrica única de Query Keys del panel — evita strings repetidos y
 * garantiza que cada combinación de filtros tenga su propia entrada de
 * caché en TanStack Query (ver ADMIN_ANALYTICS_PLAN.md §5).
 */
export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboardSummary: (filters: AdminFilters) =>
    [...adminQueryKeys.all, "dashboard-summary", filters] as const,
  ticketTrend: (filters: AdminFilters) => [...adminQueryKeys.all, "ticket-trend", filters] as const,
  ticketsByPm: (filters: AdminFilters) =>
    [...adminQueryKeys.all, "tickets-by-pm", filters] as const,
  ticketsByProject: (filters: AdminFilters) =>
    [...adminQueryKeys.all, "tickets-by-project", filters] as const,
  developerRanking: (filters: AdminFilters) =>
    [...adminQueryKeys.all, "developer-ranking", filters] as const,
  timeBreakdown: (filters: AdminFilters) =>
    [...adminQueryKeys.all, "time-breakdown", filters] as const,
  recentActivity: (filters: AdminFilters) =>
    [...adminQueryKeys.all, "recent-activity", filters] as const,
  filterOptions: () => [...adminQueryKeys.all, "filter-options"] as const,
};
