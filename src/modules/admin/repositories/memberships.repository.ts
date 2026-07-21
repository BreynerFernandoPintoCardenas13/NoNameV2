import "server-only";

import {
  AUTHORS,
  DEVELOPERS,
  MOCK_WORK_PACKAGES,
  PMS,
} from "@/modules/admin/services/mock-admin-data";

/**
 * Acceso de bajo nivel a `/api/v3/users`, `/api/v3/memberships` y
 * `/api/v3/roles` (ver ADMIN_ANALYTICS_PLAN.md §1.5/§1.6). Fase 3.5: lógica
 * real sobre el catálogo mock de personas. La resolución de "quién es PM"
 * sigue siendo una heurística (no hay concepto nativo en OpenProject) — ver
 * §1.6 antes de implementar Fase 4.
 */

export interface OpenProjectUserOption {
  id: string;
  name: string;
}

/** `users?filters=[status=active]` — cuentas no bloqueadas/invitadas (ver §4.3, no implica actividad reciente). */
export async function countActiveOpenProjectUsers(): Promise<number> {
  const ids = new Set([
    ...PMS.map((p) => p.id),
    ...DEVELOPERS.map((d) => d.id),
    ...AUTHORS.map((a) => a.id),
  ]);
  return ids.size;
}

/** Lista liviana para poblar los selectores de usuario/PM/desarrollador en `FilterBar`. */
export async function listUserOptions(): Promise<OpenProjectUserOption[]> {
  const byId = new Map<string, string>();
  for (const person of [...PMS, ...DEVELOPERS, ...AUTHORS]) byId.set(person.id, person.name);
  return [...byId.entries()].map(([id, name]) => ({ id, name }));
}

/** Miembros de un proyecto con su(s) rol(es) — derivado de quién aparece en tickets de ese proyecto. */
export async function listProjectMembers(
  projectId: string,
): Promise<{ userId: string; userName: string; roleNames: string[] }[]> {
  const members = new Map<string, { userName: string; roleNames: Set<string> }>();

  for (const wp of MOCK_WORK_PACKAGES) {
    if (wp.projectId !== projectId) continue;
    const pm = members.get(wp.responsibleId) ?? {
      userName: wp.responsibleName,
      roleNames: new Set<string>(),
    };
    pm.roleNames.add("Manager");
    members.set(wp.responsibleId, pm);

    const dev = members.get(wp.assigneeId) ?? {
      userName: wp.assigneeName,
      roleNames: new Set<string>(),
    };
    dev.roleNames.add("Member");
    members.set(wp.assigneeId, dev);
  }

  return [...members.entries()].map(([userId, entry]) => ({
    userId,
    userName: entry.userName,
    roleNames: [...entry.roleNames],
  }));
}
