import "server-only";

import type { OpenProjectService } from "@/modules/openproject/services/openproject.service";
import { extractIdFromHref } from "@/modules/admin/utils/openproject-filters";

/**
 * Acceso de bajo nivel a `/api/v3/users` y `/api/v3/memberships` (ver
 * ADMIN_ANALYTICS_PLAN.md §1.5/§1.6). La resolución de "quién es PM" sigue
 * siendo una heurística por selección manual (Fase 1) — OpenProject no
 * tiene concepto nativo de "Project Manager" (§1.6): el rol por defecto se
 * llama "Manager" (o, como en esta instancia, "Administrador de proyecto"),
 * texto libre renombrable por cualquier admin. `listProjectMembers` queda
 * preparado para esa resolución futura, sin usarse todavía para eso.
 */

export interface OpenProjectUserOption {
  id: string;
  name: string;
}

const ACTIVE_USERS_FILTER = JSON.stringify([{ status: { operator: "=", values: ["active"] } }]);

/** `users?filters=[status=active]` — cuentas no bloqueadas/invitadas (ver §4.3, no implica actividad reciente). */
export async function countActiveOpenProjectUsers(service: OpenProjectService): Promise<number> {
  const { total } = await service.queryUsers({ filters: ACTIVE_USERS_FILTER, pageSize: 1 });
  return total;
}

/** Lista liviana para poblar los selectores de usuario/PM/desarrollador en `FilterBar`. */
export async function listUserOptions(
  service: OpenProjectService,
): Promise<OpenProjectUserOption[]> {
  const { elements } = await service.queryUsers({ filters: ACTIVE_USERS_FILTER, pageSize: 500 });
  return elements.map((user) => ({ id: String(user.id), name: user.name }));
}

/** Miembros de un proyecto con su(s) rol(es), vía `/api/v3/memberships` — única tabla de unión real (§1.6). */
export async function listProjectMembers(
  service: OpenProjectService,
  projectId: string,
): Promise<{ userId: string; userName: string; roleNames: string[] }[]> {
  const filters = JSON.stringify([{ project: { operator: "=", values: [projectId] } }]);
  const { elements } = await service.queryMemberships({ filters, pageSize: 200 });

  return elements
    .filter((membership) => membership._links.principal?.href)
    .map((membership) => ({
      userId: extractIdFromHref(membership._links.principal?.href) ?? "",
      userName: membership._links.principal?.title ?? "—",
      roleNames: (membership._links.roles ?? []).map((role) => role.title ?? "—"),
    }));
}
