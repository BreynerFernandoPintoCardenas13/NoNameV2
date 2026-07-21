import "server-only";

/**
 * Acceso de bajo nivel a `/api/v3/projects` (ver ADMIN_ANALYTICS_PLAN.md
 * §1.4). Fase 3: solo interfaz pública, sin llamadas reales todavía.
 */

export interface OpenProjectProjectOption {
  id: string;
  name: string;
}

/** `filters=[active=true]`, cuenta vía `total` de la respuesta. */
export async function countActiveProjects(): Promise<number> {
  throw new Error("Not implemented");
}

/** Lista liviana para poblar el selector de proyecto en `FilterBar`. */
export async function listProjectOptions(): Promise<OpenProjectProjectOption[]> {
  throw new Error("Not implemented");
}
