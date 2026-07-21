import { z } from "zod";

/**
 * Filtros globales del panel — validados aquí para usarse tanto en el
 * cliente (al leer/escribir la URL en `useAdminFilters`) como, en Fase 4,
 * en cada Route Handler (nunca confiar en el query string sin validar).
 * Formato de fecha `YYYY-MM-DD`, el mismo que produce `<input type="date">`
 * ya usado en el resto de la app (ver modules/notes/components/MetadataDialogs).
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (se espera YYYY-MM-DD)");

const optionalId = z.string().trim().min(1).nullable().default(null);

export const adminFiltersSchema = z.object({
  dateFrom: isoDate.nullable().default(null),
  dateTo: isoDate.nullable().default(null),
  projectId: optionalId,
  userId: optionalId,
  pmId: optionalId,
  developerId: optionalId,
  ticketType: optionalId,
});

/** Forma ya validada/con defaults aplicados — estructuralmente igual a `AdminFilters` (types/index.ts). */
export type AdminFiltersParsed = z.output<typeof adminFiltersSchema>;
