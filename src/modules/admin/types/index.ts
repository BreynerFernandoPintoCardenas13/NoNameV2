/**
 * Metadatos de una sección de reporte del Panel Administrador. Fase 2: solo
 * describe el placeholder (título/descripción); los tipos de datos reales
 * (AdminFilters, DashboardSummary, TrendPoint, Ranking*, etc. — ver
 * ADMIN_ANALYTICS_PLAN.md §2.5) se agregan cuando se implemente cada reporte,
 * no antes.
 */
export interface AdminReportSection {
  id: string;
  title: string;
  description: string;
}
