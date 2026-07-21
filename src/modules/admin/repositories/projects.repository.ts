import "server-only";

import { PROJECTS } from "@/modules/admin/services/mock-admin-data";

/**
 * Acceso de bajo nivel a `/api/v3/projects` (ver ADMIN_ANALYTICS_PLAN.md
 * §1.4). Fase 3.5: lógica real sobre `PROJECTS` (el catálogo mock) — en
 * Fase 4 esto pasa a filtrar la respuesta real de OpenProject por
 * `active=true`, sin cambiar la firma de ninguna función.
 */

export interface OpenProjectProjectOption {
  id: string;
  name: string;
}

/** `filters=[active=true]`, cuenta vía `total` de la respuesta. Todos los proyectos mock están activos. */
export async function countActiveProjects(): Promise<number> {
  return PROJECTS.length;
}

/** Lista liviana para poblar el selector de proyecto en `FilterBar`. */
export async function listProjectOptions(): Promise<OpenProjectProjectOption[]> {
  return PROJECTS.map((project) => ({ id: project.id, name: project.name }));
}
