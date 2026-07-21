import "server-only";

/**
 * Métricas 100% internas (Supabase), sin relación con OpenProject — ver
 * ADMIN_ANALYTICS_PLAN.md §12. Fase 4 es "Mock → OpenProject" (§ del
 * encargo): este archivo queda explícitamente fuera de ese alcance — la
 * conexión real a Supabase es trabajo de una fase posterior. Los valores de
 * abajo simulan el resultado de esa consulta mientras tanto; viven aquí
 * directamente (no en `mock-admin-data.ts`, que Fase 4 dejó sin uso) porque
 * nunca fueron datos de OpenProject.
 */

/** Simula `select count(*) from users where role = 'project_manager'`. */
const SIMULATED_ACTIVE_PMS_COUNT = 4;
export async function countActivePms(): Promise<number> {
  return SIMULATED_ACTIVE_PMS_COUNT;
}

/** Simula `select count(*) from ticket_analyses where status = 'confirmed'`. */
const SIMULATED_PROCESSED_MEETINGS_COUNT = 52;
export async function countProcessedMeetings(): Promise<number> {
  return SIMULATED_PROCESSED_MEETINGS_COUNT;
}
