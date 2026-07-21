import "server-only";

/**
 * Métricas 100% internas (Supabase), sin relación con OpenProject — ver
 * ADMIN_ANALYTICS_PLAN.md §12. "Reuniones procesadas" sale de
 * `ticket_analyses`, no de ningún endpoint de OpenProject.
 */

/** Cuenta de `ticket_analyses` con `status = 'confirmed'`. */
export async function countProcessedMeetings(): Promise<number> {
  throw new Error("Not implemented");
}
