import "server-only";

import type { OpenProjectService } from "@/modules/openproject/services/openproject.service";

/**
 * Acceso de bajo nivel a `/api/v3/projects` (ver ADMIN_ANALYTICS_PLAN.md
 * §1.4). "Activo" = `active: true` (no archivado) — no implica actividad
 * reciente (esa señal, si hiciera falta, sería `latest_activity_at`, fuera
 * de alcance de los reportes pedidos).
 */

export interface OpenProjectProjectOption {
  id: string;
  name: string;
}

const ACTIVE_FILTER = JSON.stringify([{ active: { operator: "=", values: ["t"] } }]);

/** `filters=[active=true]`, cuenta vía `total` de la respuesta — nunca trae filas. */
export async function countActiveProjects(service: OpenProjectService): Promise<number> {
  const { total } = await service.queryProjects({ filters: ACTIVE_FILTER, pageSize: 1 });
  return total;
}

/**
 * Lista liviana para poblar el selector de proyecto en `FilterBar` (vía
 * `/api/admin/filter-options`). `pageSize: 500` cubre con holgura el total
 * real de proyectos activos observado en la instancia (401) sin paginar.
 */
export async function listProjectOptions(
  service: OpenProjectService,
): Promise<OpenProjectProjectOption[]> {
  const { elements } = await service.queryProjects({ filters: ACTIVE_FILTER, pageSize: 500 });
  return elements.map((project) => ({ id: String(project.id), name: project.name }));
}
