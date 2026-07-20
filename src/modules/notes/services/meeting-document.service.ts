import type { JSONContent } from "@tiptap/core";

import type { MeetingDocument, TicketTracking } from "@/modules/notes/types";

/**
 * Manipulación mecánica del documento de una reunión (JSON nativo de Tiptap).
 * Portado de `MeetingDocumentService` de V1 como funciones puras: no hay
 * estado ni dependencias de entorno, así que sirve igual en cliente y
 * servidor. No interpreta el CONTENIDO (eso es trabajo de la IA), pero sí
 * conoce la ESTRUCTURA lo suficiente para filtrar y marcar bloques.
 */

/** Valida y devuelve un documento recibido desde el editor o almacenamiento. */
export function loadMeetingDocument(raw: unknown): MeetingDocument {
  if (!raw || typeof raw !== "object" || (raw as JSONContent).type !== "doc") {
    throw new Error(
      "El documento recibido no tiene un formato válido (se esperaba un doc de Tiptap).",
    );
  }
  return raw as MeetingDocument;
}

export function isFrozenBlock(node: JSONContent): boolean {
  const tracking = node.attrs?.ticket as TicketTracking | undefined;
  return tracking?.status === "frozen";
}

/** Una imagen siempre cuenta; un nodo de texto cuenta solo si no es puro espacio en blanco. */
export function hasMeaningfulContent(node: JSONContent): boolean {
  if (node.type === "image") return true;
  if (node.type === "text") return (node.text ?? "").trim().length > 0;
  return (node.content ?? []).some((child) => hasMeaningfulContent(child));
}

/**
 * Bloques de nivel superior que siguen activos: no Frozen Y con contenido
 * real. Criterio ÚNICO compartido por el chequeo local del botón "Crear
 * Tickets" (cliente) y `prepareForAI` (servidor) — en V1 estaba duplicado
 * en `ticketDraftService.ts` y `MeetingDocumentService` (§15 del plan).
 */
export function getActiveBlocks(document: MeetingDocument): JSONContent[] {
  return (document.content ?? []).filter(
    (block) => !isFrozenBlock(block) && hasMeaningfulContent(block),
  );
}

export function hasPendingTicketDrafts(document: MeetingDocument): boolean {
  return getActiveBlocks(document).length > 0;
}

/**
 * Prepara el documento para la IA:
 * 1. Descarta bloques Frozen (la IA nunca los ve, no puede re-proponerlos).
 * 2. Descarta bloques sin contenido real (el párrafo vacío final de Tiptap).
 * 3. Agrega a cada bloque restante su `blockIndex`: la posición REAL en
 *    `document.content` (no una relativa a la lista filtrada) — lo que la IA
 *    devuelva en `sourceBlockIndices` apunta directo al bloque correcto.
 */
export function prepareForAI(document: MeetingDocument): MeetingDocument {
  const content = (document.content ?? [])
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => !isFrozenBlock(node) && hasMeaningfulContent(node))
    .map(({ node, index }) => ({ ...node, attrs: { ...node.attrs, blockIndex: index } }));
  return { ...document, content };
}

/**
 * Congela (Frozen) los bloques indicados (por su posición real en
 * `document.content`), escribiendo el mismo `TicketTracking` en cada uno —
 * texto Y también imágenes. Se llama justo después de que OpenProject
 * confirma la creación de cada ticket.
 */
export function applyTicketTracking(
  document: MeetingDocument,
  trackingByBlockIndex: Map<number, TicketTracking>,
): MeetingDocument {
  if (trackingByBlockIndex.size === 0) return document;
  const content = (document.content ?? []).map((node, index) => {
    const tracking = trackingByBlockIndex.get(index);
    return tracking ? { ...node, attrs: { ...node.attrs, ticket: tracking } } : node;
  });
  return { ...document, content };
}
