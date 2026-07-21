import type { NextRequest } from "next/server";

import * as membershipsRepo from "@/modules/admin/repositories/memberships.repository";
import * as projectsRepo from "@/modules/admin/repositories/projects.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";
import type { AdminFilterOptions } from "@/modules/admin/types";

/**
 * Opciones para poblar `FilterBar` (proyecto/PM/desarrollador) — no depende
 * de los filtros actuales, siempre devuelve el catálogo completo. OpenProject
 * no distingue "PM" de "desarrollador" como colecciones separadas (ver
 * ADMIN_ANALYTICS_PLAN.md §1.6: cualquier usuario es seleccionable como
 * cualquiera de los dos en Fase 1), así que `users`/`developers` salen del
 * mismo listado de usuarios.
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (filters, service): Promise<AdminFilterOptions> => {
    void filters;
    const [projects, users] = await Promise.all([
      projectsRepo.listProjectOptions(service),
      membershipsRepo.listUserOptions(service),
    ]);
    return { projects, users, developers: users };
  });
}
