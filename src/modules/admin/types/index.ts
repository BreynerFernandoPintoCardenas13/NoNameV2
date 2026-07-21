/**
 * Tipos del módulo Admin — contrato estable entre `admin-analytics.service.ts`
 * (cliente) y los repositories (servidor, con OpenProject real desde Fase 4).
 * Ver ADMIN_ANALYTICS_PLAN.md §2.5/§12/§13 para el origen de cada campo.
 */

/** Metadatos de una sección de reporte (título/descripción — ver utils/report-sections.ts). */
export interface AdminReportSection {
  id: string;
  title: string;
  description: string;
}

/** Opciones para poblar los selectores de `FilterBar` — proyectos/usuarios/desarrolladores de OpenProject. */
export interface AdminFilterOptions {
  projects: { id: string; name: string }[];
  users: { id: string; name: string }[];
  developers: { id: string; name: string }[];
}

/** Filtros globales compartidos por todo el panel (ver §14 del plan). */
export interface AdminFilters {
  dateFrom: string | null;
  dateTo: string | null;
  projectId: string | null;
  userId: string | null;
  pmId: string | null;
  developerId: string | null;
  ticketType: string | null;
}

/** Una card de "Dashboard General": número + variación opcional contra el período anterior. */
export interface StatCardData {
  id: string;
  label: string;
  value: number;
  unit?: string;
  changePercent?: number | null;
  /** Aclara el origen/limitación del dato cuando no es evidente (ver §4.3 del plan). */
  caveat?: string;
}

export interface DashboardSummary {
  stats: StatCardData[];
}

/** Un punto de la tendencia de tickets, ya bucketeado (día/semana/mes). */
export interface TrendPoint {
  bucketKey: string;
  bucketLabel: string;
  count: number;
}

export type TrendGranularity = "day" | "week" | "month";

export interface TicketTrend {
  granularity: TrendGranularity;
  points: TrendPoint[];
  totalCurrentPeriod: number;
  totalPreviousPeriod: number;
  changePercent: number;
}

/** Resultado de agrupar tickets por una dimensión (PM o Proyecto) — vía `groupBy`+`showSums`. */
export interface TicketDistribution {
  groupId: string;
  groupName: string;
  ticketCount: number;
  estimatedHours: number;
}

/** Ranking de desarrolladores con sus 4 métricas (la tabla es ordenable por cualquiera). */
export interface DeveloperRankingItem {
  id: string;
  name: string;
  ticketCount: number;
  estimatedHours: number;
  projectCount: number;
  /** Métrica compuesta definida por nosotros, no un concepto de OpenProject (ver §12). */
  workload: number;
}

/** Un corte de tiempo trabajado (por proyecto, por desarrollador o por PM). */
export interface TimeBreakdownEntry {
  groupId: string;
  groupName: string;
  estimatedHours: number;
  averageHoursPerTicket: number;
}

export interface TimeSummary {
  byProject: TimeBreakdownEntry[];
  byDeveloper: TimeBreakdownEntry[];
  byPm: TimeBreakdownEntry[];
  averageHoursPerTicket: number;
  averageHoursPerProject: number;
}

/** Fila de "Actividad reciente" — tickets actualizados recientemente, no un log de auditoría (ver §8, riesgo 5). */
export interface ActivityItem {
  id: string;
  ticketId: string;
  ticketSubject: string;
  projectName: string;
  responsibleName: string | null;
  pmName: string | null;
  updatedAt: string;
}
