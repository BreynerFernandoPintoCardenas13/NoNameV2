import "server-only";

/**
 * Acceso de bajo nivel a `/api/v3/users`, `/api/v3/memberships` y
 * `/api/v3/roles` (ver ADMIN_ANALYTICS_PLAN.md §1.5/§1.6). Fase 3: solo
 * interfaz pública. La resolución de "quién es PM" es una heurística (no
 * hay concepto nativo en OpenProject) — ver §1.6 antes de implementar.
 */

export interface OpenProjectUserOption {
  id: string;
  name: string;
}

/** `users?filters=[status=active]` — cuentas no bloqueadas/invitadas (ver §4.3, no implica actividad reciente). */
export async function countActiveOpenProjectUsers(): Promise<number> {
  throw new Error("Not implemented");
}

/** Lista liviana para poblar los selectores de usuario/PM/desarrollador en `FilterBar`. */
export async function listUserOptions(): Promise<OpenProjectUserOption[]> {
  throw new Error("Not implemented");
}

/** Miembros de un proyecto con su(s) rol(es) — la tabla de unión usuario↔proyecto↔rol. */
export async function listProjectMembers(
  projectId: string,
): Promise<{ userId: string; userName: string; roleNames: string[] }[]> {
  void projectId;
  throw new Error("Not implemented");
}
