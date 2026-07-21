/**
 * Datos RAW del Panel Administrador — Fase 3.5. A propósito NO están
 * pre-agregados: los repositories (repositories/*.ts) son quienes agrupan,
 * suman, ordenan y calculan variaciones sobre estos registros, exactamente
 * como lo harán sobre la respuesta real de OpenProject en Fase 4. Generados
 * con una fórmula fija (nunca `Math.random()`) para ser 100% reproducibles.
 */

export const PROJECTS = [
  { id: "proj-1", name: "Sitio Web Corporativo" },
  { id: "proj-2", name: "App Móvil Clientes" },
  { id: "proj-3", name: "Migración ERP" },
  { id: "proj-4", name: "Portal de Soporte" },
  { id: "proj-5", name: "Integración de Pagos" },
  { id: "proj-6", name: "Dashboard Interno" },
] as const;

export const PMS = [
  { id: "pm-1", name: "Laura Gómez" },
  { id: "pm-2", name: "Carlos Ruiz" },
  { id: "pm-3", name: "Ana Martínez" },
  { id: "pm-4", name: "Diego Torres" },
] as const;

export const DEVELOPERS = [
  { id: "dev-1", name: "Sofía Ramírez" },
  { id: "dev-2", name: "Julián Pérez" },
  { id: "dev-3", name: "Camila Rojas" },
  { id: "dev-4", name: "Mateo Londoño" },
  { id: "dev-5", name: "Valentina Cruz" },
  { id: "dev-6", name: "Andrés Silva" },
] as const;

export const AUTHORS = [
  { id: "user-1", name: "Laura Gómez" },
  { id: "user-2", name: "Carlos Ruiz" },
  { id: "user-3", name: "Sofía Ramírez" },
] as const;

export const TICKET_TYPES = ["Tarea", "Bug", "Mejora"] as const;

const SUBJECT_TEMPLATES = [
  "Corregir validación del formulario",
  "Ajustar diseño responsive",
  "Migrar tabla al nuevo esquema",
  "Agregar filtro de fecha",
  "Optimizar consulta de reportes",
  "Actualizar textos legales",
  "Configurar webhook de confirmación",
  "Revisar accesibilidad del formulario",
  "Corregir zona horaria en reportes",
  "Agregar exportación a CSV",
  "Resolver conflicto de merge en release",
  "Documentar endpoint interno",
] as const;

/**
 * Ancla fija (no `Date.now()`) para que el dataset sea reproducible siempre.
 * Construida en hora LOCAL a propósito: los límites de "hoy/esta semana/este
 * mes" en utils/date-buckets.ts también operan en hora local — usar el mismo
 * marco de referencia evita que un ticket "de hoy" caiga en el bucket
 * equivocado por una diferencia de huso horario.
 */
export const MOCK_TODAY = new Date(2026, 6, 20, 12, 0, 0);

export interface MockWorkPackage {
  id: string;
  subject: string;
  type: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  responsibleId: string;
  responsibleName: string;
  authorId: string;
  authorName: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Genera work packages deterministas: 2-4 tickets por día durante los
 * últimos 60 días (fórmula fija, no aleatoria) — suficiente volumen para
 * validar tendencia, variación contra el período anterior y rankings.
 */
function generateMockWorkPackages(): MockWorkPackage[] {
  const workPackages: MockWorkPackage[] = [];
  const TICKETS_PER_DAY = [2, 3, 4, 3];
  let index = 0;

  for (let daysAgo = 59; daysAgo >= 0; daysAgo -= 1) {
    const ticketsToday = TICKETS_PER_DAY[daysAgo % TICKETS_PER_DAY.length];
    for (let slot = 0; slot < ticketsToday; slot += 1) {
      const project = PROJECTS[index % PROJECTS.length];
      const pm = PMS[index % PMS.length];
      const developer = DEVELOPERS[index % DEVELOPERS.length];
      const author = AUTHORS[index % AUTHORS.length];
      const type = TICKET_TYPES[index % TICKET_TYPES.length];
      const subject = SUBJECT_TEMPLATES[index % SUBJECT_TEMPLATES.length];
      const estimatedHours = 1 + (index % 8) * 0.5; // 1h .. 4.5h, determinista

      const createdAt = new Date(MOCK_TODAY);
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(9 + (slot % 6), 0, 0, 0);

      const updatedAt = new Date(createdAt);
      updatedAt.setHours(updatedAt.getHours() + 2 + (index % 10));

      workPackages.push({
        id: String(1000 + index),
        subject: `${subject} — ${project.name}`,
        type,
        projectId: project.id,
        projectName: project.name,
        assigneeId: developer.id,
        assigneeName: developer.name,
        responsibleId: pm.id,
        responsibleName: pm.name,
        authorId: author.id,
        authorName: author.name,
        estimatedHours,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
      index += 1;
    }
  }

  return workPackages;
}

export const MOCK_WORK_PACKAGES: MockWorkPackage[] = generateMockWorkPackages();

export interface MockTimeEntry {
  hours: string; // duración ISO 8601, ej. "PT5H30M"
  userId: string;
  projectId: string;
  workPackageId: string | null;
  spentOn: string;
}

/**
 * Time entries deterministas, más escasas que los work packages a
 * propósito: en la práctica no todo el mundo registra tiempo real en
 * OpenProject (ver ADMIN_ANALYTICS_PLAN.md §8, riesgo 3).
 */
function generateMockTimeEntries(): MockTimeEntry[] {
  return MOCK_WORK_PACKAGES.filter((_, index) => index % 4 === 0).map((wp, index) => {
    const spentHours = 1 + (index % 4); // 1..4h, determinista
    return {
      hours: `PT${spentHours}H`,
      userId: wp.assigneeId,
      projectId: wp.projectId,
      workPackageId: wp.id,
      spentOn: wp.createdAt.slice(0, 10),
    };
  });
}

export const MOCK_TIME_ENTRIES: MockTimeEntry[] = generateMockTimeEntries();

/** Simula lo que hoy vendría de `users` en Supabase (role = project_manager). */
export const MOCK_ACTIVE_PMS_COUNT = PMS.length;

/** Simula lo que hoy vendría de `ticket_analyses` (status = 'confirmed') en Supabase. */
export const MOCK_PROCESSED_MEETINGS_COUNT = 52;
