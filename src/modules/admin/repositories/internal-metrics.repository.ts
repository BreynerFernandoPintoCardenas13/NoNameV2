import "server-only";

import {
  MOCK_ACTIVE_PMS_COUNT,
  MOCK_PROCESSED_MEETINGS_COUNT,
} from "@/modules/admin/services/mock-admin-data";

/**
 * Métricas 100% internas (Supabase), sin relación con OpenProject — ver
 * ADMIN_ANALYTICS_PLAN.md §12. Fase 3.5: devuelven el número mock fijo que
 * simula la consulta real; Supabase todavía no se conecta aquí (eso es
 * trabajo de una fase posterior, fuera del alcance de "Mock → OpenProject").
 */

/** Simula `select count(*) from users where role = 'project_manager'`. */
export async function countActivePms(): Promise<number> {
  return MOCK_ACTIVE_PMS_COUNT;
}

/** Simula `select count(*) from ticket_analyses where status = 'confirmed'`. */
export async function countProcessedMeetings(): Promise<number> {
  return MOCK_PROCESSED_MEETINGS_COUNT;
}
