import type {
  ActivityItem,
  DashboardSummary,
  DeveloperRankingItem,
  TicketDistribution,
  TicketTrend,
  TimeSummary,
} from "@/modules/admin/types";

/**
 * Datos mock del Panel Administrador — Fase 3. Coherentes entre sí (mismos
 * proyectos/personas en todos los reportes) y con números fijos (nunca
 * `Math.random()`), para que el diseño se pueda validar de forma repetible.
 * `admin-analytics.service.ts` es el único consumidor: en Fase 4 este
 * archivo deja de importarse, sin que cambie la forma de los datos.
 */

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  stats: [
    { id: "tickets-today", label: "Tickets creados hoy", value: 7 },
    { id: "tickets-week", label: "Tickets esta semana", value: 34, changePercent: 12.5 },
    { id: "tickets-month", label: "Tickets este mes", value: 128, changePercent: -4.2 },
    { id: "estimated-hours-month", label: "Horas estimadas este mes", value: 342, unit: "h" },
    { id: "active-projects", label: "Proyectos activos", value: 6 },
    {
      id: "active-pms",
      label: "Project Managers activos",
      value: 4,
      caveat: "Fuente: tabla interna de NoName (role = project_manager)",
    },
    {
      id: "active-users",
      label: "Usuarios activos",
      value: 18,
      caveat: "Cuentas no bloqueadas en OpenProject — no implica actividad reciente",
    },
    {
      id: "meetings-processed",
      label: "Reuniones procesadas",
      value: 52,
      caveat: "Fuente: ticket_analyses en Supabase, no proviene de OpenProject",
    },
  ],
};

export const MOCK_TICKET_TREND: TicketTrend = {
  granularity: "day",
  totalCurrentPeriod: 128,
  totalPreviousPeriod: 134,
  changePercent: -4.5,
  points: [
    { bucketKey: "2026-07-07", bucketLabel: "07 jul", count: 6 },
    { bucketKey: "2026-07-08", bucketLabel: "08 jul", count: 9 },
    { bucketKey: "2026-07-09", bucketLabel: "09 jul", count: 4 },
    { bucketKey: "2026-07-10", bucketLabel: "10 jul", count: 11 },
    { bucketKey: "2026-07-11", bucketLabel: "11 jul", count: 8 },
    { bucketKey: "2026-07-12", bucketLabel: "12 jul", count: 2 },
    { bucketKey: "2026-07-13", bucketLabel: "13 jul", count: 3 },
    { bucketKey: "2026-07-14", bucketLabel: "14 jul", count: 12 },
    { bucketKey: "2026-07-15", bucketLabel: "15 jul", count: 10 },
    { bucketKey: "2026-07-16", bucketLabel: "16 jul", count: 7 },
    { bucketKey: "2026-07-17", bucketLabel: "17 jul", count: 13 },
    { bucketKey: "2026-07-18", bucketLabel: "18 jul", count: 5 },
    { bucketKey: "2026-07-19", bucketLabel: "19 jul", count: 1 },
    { bucketKey: "2026-07-20", bucketLabel: "20 jul", count: 7 },
  ],
};

export const MOCK_TICKETS_BY_PM: TicketDistribution[] = [
  { groupId: "pm-1", groupName: "Laura Gómez", ticketCount: 41, estimatedHours: 118 },
  { groupId: "pm-2", groupName: "Carlos Ruiz", ticketCount: 33, estimatedHours: 96 },
  { groupId: "pm-3", groupName: "Ana Martínez", ticketCount: 29, estimatedHours: 74 },
  { groupId: "pm-4", groupName: "Diego Torres", ticketCount: 25, estimatedHours: 54 },
];

export const MOCK_TICKETS_BY_PROJECT: TicketDistribution[] = [
  { groupId: "proj-1", groupName: "Sitio Web Corporativo", ticketCount: 28, estimatedHours: 82 },
  { groupId: "proj-2", groupName: "App Móvil Clientes", ticketCount: 34, estimatedHours: 121 },
  { groupId: "proj-3", groupName: "Migración ERP", ticketCount: 19, estimatedHours: 96 },
  { groupId: "proj-4", groupName: "Portal de Soporte", ticketCount: 22, estimatedHours: 58 },
  { groupId: "proj-5", groupName: "Integración de Pagos", ticketCount: 15, estimatedHours: 47 },
  { groupId: "proj-6", groupName: "Dashboard Interno", ticketCount: 10, estimatedHours: 38 },
];

export const MOCK_DEVELOPER_RANKING: DeveloperRankingItem[] = [
  {
    id: "dev-1",
    name: "Sofía Ramírez",
    ticketCount: 31,
    estimatedHours: 96,
    projectCount: 3,
    workload: 74,
  },
  {
    id: "dev-2",
    name: "Julián Pérez",
    ticketCount: 27,
    estimatedHours: 88,
    projectCount: 2,
    workload: 68,
  },
  {
    id: "dev-3",
    name: "Camila Rojas",
    ticketCount: 24,
    estimatedHours: 71,
    projectCount: 4,
    workload: 65,
  },
  {
    id: "dev-4",
    name: "Mateo Londoño",
    ticketCount: 19,
    estimatedHours: 54,
    projectCount: 2,
    workload: 48,
  },
  {
    id: "dev-5",
    name: "Valentina Cruz",
    ticketCount: 16,
    estimatedHours: 45,
    projectCount: 3,
    workload: 41,
  },
  {
    id: "dev-6",
    name: "Andrés Silva",
    ticketCount: 11,
    estimatedHours: 29,
    projectCount: 1,
    workload: 26,
  },
];

export const MOCK_TIME_SUMMARY: TimeSummary = {
  averageHoursPerTicket: 2.7,
  averageHoursPerProject: 73.7,
  byProject: [
    {
      groupId: "proj-1",
      groupName: "Sitio Web Corporativo",
      estimatedHours: 82,
      averageHoursPerTicket: 2.9,
    },
    {
      groupId: "proj-2",
      groupName: "App Móvil Clientes",
      estimatedHours: 121,
      averageHoursPerTicket: 3.6,
    },
    {
      groupId: "proj-3",
      groupName: "Migración ERP",
      estimatedHours: 96,
      averageHoursPerTicket: 5.1,
    },
    {
      groupId: "proj-4",
      groupName: "Portal de Soporte",
      estimatedHours: 58,
      averageHoursPerTicket: 2.6,
    },
    {
      groupId: "proj-5",
      groupName: "Integración de Pagos",
      estimatedHours: 47,
      averageHoursPerTicket: 3.1,
    },
    {
      groupId: "proj-6",
      groupName: "Dashboard Interno",
      estimatedHours: 38,
      averageHoursPerTicket: 3.8,
    },
  ],
  byDeveloper: [
    {
      groupId: "dev-1",
      groupName: "Sofía Ramírez",
      estimatedHours: 96,
      averageHoursPerTicket: 3.1,
    },
    { groupId: "dev-2", groupName: "Julián Pérez", estimatedHours: 88, averageHoursPerTicket: 3.3 },
    { groupId: "dev-3", groupName: "Camila Rojas", estimatedHours: 71, averageHoursPerTicket: 3.0 },
    {
      groupId: "dev-4",
      groupName: "Mateo Londoño",
      estimatedHours: 54,
      averageHoursPerTicket: 2.8,
    },
    {
      groupId: "dev-5",
      groupName: "Valentina Cruz",
      estimatedHours: 45,
      averageHoursPerTicket: 2.8,
    },
    { groupId: "dev-6", groupName: "Andrés Silva", estimatedHours: 29, averageHoursPerTicket: 2.6 },
  ],
  byPm: [
    { groupId: "pm-1", groupName: "Laura Gómez", estimatedHours: 118, averageHoursPerTicket: 2.9 },
    { groupId: "pm-2", groupName: "Carlos Ruiz", estimatedHours: 96, averageHoursPerTicket: 2.9 },
    { groupId: "pm-3", groupName: "Ana Martínez", estimatedHours: 74, averageHoursPerTicket: 2.6 },
    { groupId: "pm-4", groupName: "Diego Torres", estimatedHours: 54, averageHoursPerTicket: 2.2 },
  ],
};

export const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    ticketId: "1042",
    ticketSubject: "Corregir validación del formulario de pago",
    projectName: "Integración de Pagos",
    responsibleName: "Andrés Silva",
    pmName: "Diego Torres",
    updatedAt: "2026-07-20T14:32:00.000Z",
  },
  {
    id: "act-2",
    ticketId: "1041",
    ticketSubject: "Ajustar diseño responsive del checkout",
    projectName: "App Móvil Clientes",
    responsibleName: "Sofía Ramírez",
    pmName: "Laura Gómez",
    updatedAt: "2026-07-20T13:58:00.000Z",
  },
  {
    id: "act-3",
    ticketId: "1039",
    ticketSubject: "Migrar tabla de clientes al nuevo esquema",
    projectName: "Migración ERP",
    responsibleName: "Camila Rojas",
    pmName: "Ana Martínez",
    updatedAt: "2026-07-20T11:15:00.000Z",
  },
  {
    id: "act-4",
    ticketId: "1037",
    ticketSubject: "Agregar filtro de fecha al panel de soporte",
    projectName: "Portal de Soporte",
    responsibleName: "Mateo Londoño",
    pmName: "Carlos Ruiz",
    updatedAt: "2026-07-20T09:47:00.000Z",
  },
  {
    id: "act-5",
    ticketId: "1035",
    ticketSubject: "Optimizar consulta de reportes mensuales",
    projectName: "Dashboard Interno",
    responsibleName: "Valentina Cruz",
    pmName: null,
    updatedAt: "2026-07-19T18:20:00.000Z",
  },
  {
    id: "act-6",
    ticketId: "1033",
    ticketSubject: "Actualizar textos legales del sitio",
    projectName: "Sitio Web Corporativo",
    responsibleName: null,
    pmName: "Laura Gómez",
    updatedAt: "2026-07-19T16:05:00.000Z",
  },
  {
    id: "act-7",
    ticketId: "1030",
    ticketSubject: "Configurar webhook de confirmación de pago",
    projectName: "Integración de Pagos",
    responsibleName: "Julián Pérez",
    pmName: "Diego Torres",
    updatedAt: "2026-07-19T10:40:00.000Z",
  },
  {
    id: "act-8",
    ticketId: "1028",
    ticketSubject: "Revisar accesibilidad del formulario de registro",
    projectName: "App Móvil Clientes",
    responsibleName: "Sofía Ramírez",
    pmName: "Laura Gómez",
    updatedAt: "2026-07-18T15:12:00.000Z",
  },
  {
    id: "act-9",
    ticketId: "1025",
    ticketSubject: "Corregir zona horaria en reportes de tiempo",
    projectName: "Migración ERP",
    responsibleName: "Camila Rojas",
    pmName: "Ana Martínez",
    updatedAt: "2026-07-18T09:03:00.000Z",
  },
  {
    id: "act-10",
    ticketId: "1021",
    ticketSubject: "Agregar exportación CSV al portal de soporte",
    projectName: "Portal de Soporte",
    responsibleName: "Mateo Londoño",
    pmName: "Carlos Ruiz",
    updatedAt: "2026-07-17T20:31:00.000Z",
  },
];
