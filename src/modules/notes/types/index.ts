import type { JSONContent } from "@tiptap/core";

/**
 * El documento de una reunión es, literalmente, el JSON nativo de Tiptap
 * (lo que devuelve `editor.getJSON()`). No se define un tipo propio en
 * paralelo para no arriesgar divergencias — decisión heredada de V1.
 */
export type MeetingDocument = JSONContent;

/** Documento vacío de una nota recién creada. */
export const EMPTY_DOCUMENT: MeetingDocument = { type: "doc", content: [{ type: "paragraph" }] };

/**
 * Único estado posible hoy: un ticket ya creado en OpenProject queda
 * "Frozen" — deja de existir para la IA pero sigue visible en la nota.
 * Unión de un solo valor a propósito: agregar un estado futuro es sumar un
 * literal, no rediseñar el mecanismo.
 */
export type TicketDraftStatus = "frozen";

/**
 * Estado de seguimiento de un ticket, embebido como atributo (`ticket`) en
 * los bloques de nivel superior del documento que lo originaron.
 */
export interface TicketTracking {
  ticketId: string;
  status: TicketDraftStatus;
  workPackageId?: number;
  workPackageUrl?: string;
  createdAt?: string;
}

/** Una nota de reunión. Pertenece exclusivamente a un proyecto. */
export interface MeetingNote {
  id: string;
  projectId: string;
  title: string;
  document: MeetingDocument;
  createdAt: string;
  updatedAt: string;
}

/** Fila de la sidebar: la nota sin su documento (no cargar MB de JSON para un árbol). */
export interface MeetingNoteSummary {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
