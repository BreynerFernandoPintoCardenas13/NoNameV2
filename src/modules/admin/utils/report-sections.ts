import type { AdminReportSection } from "@/modules/admin/types";

/**
 * Las 7 secciones de reporte definidas en ADMIN_ANALYTICS_PLAN.md §13. Fase 2
 * solo las presenta como placeholders; cada una gana su propio hook/servicio
 * cuando se implemente (ver el plan para el mapeo endpoint → reporte).
 */
export const REPORT_SECTIONS: AdminReportSection[] = [
  {
    id: "dashboard-general",
    title: "Dashboard General",
    description: "Tickets creados hoy/semana/mes, horas estimadas, proyectos y usuarios activos.",
  },
  {
    id: "ticket-trend",
    title: "Tendencia de Tickets",
    description: "Tickets por día, semana y mes, comparados contra el período anterior.",
  },
  {
    id: "tickets-by-pm",
    title: "Tickets por Project Manager",
    description: "Ranking, gráfica y tabla de tickets agrupados por responsable.",
  },
  {
    id: "tickets-by-project",
    title: "Tickets por Proyecto",
    description: "Ranking, gráfica y tabla de tickets agrupados por proyecto.",
  },
  {
    id: "developer-ranking",
    title: "Ranking de Desarrolladores",
    description: "Más tickets asignados, más horas estimadas, más proyectos y mayor carga.",
  },
  {
    id: "time-breakdown",
    title: "Tiempo Trabajado",
    description: "Horas por proyecto, por desarrollador, por PM y promedios por ticket.",
  },
  {
    id: "recent-activity",
    title: "Actividad Reciente",
    description: "Tickets actualizados recientemente: proyecto, responsable, PM y fecha.",
  },
];
