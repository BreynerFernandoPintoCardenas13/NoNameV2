import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import type { TicketTracking } from "@/modules/notes/types";

const TICKET_TRACKING_NODE_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "image",
];

/**
 * Adjunta un atributo `ticket` (TicketTracking) a los bloques que ya
 * produjeron un ticket real en OpenProject. A diferencia de `metadata`,
 * esta extensión nunca escribe el atributo desde el cliente: llega ya
 * puesto en el documento que devuelve el servidor tras crear los tickets —
 * por eso no tiene `addCommands`, solo lectura y presentación (barra verde
 * + chip "✓ Ticket creado" con enlace al Work Package). Portada de V1.
 */
export const TicketTrackingExtension = Extension.create({
  name: "ticketTracking",

  addGlobalAttributes() {
    return [
      {
        types: TICKET_TRACKING_NODE_TYPES,
        attributes: {
          ticket: {
            default: null,
            parseHTML: (element) => {
              const raw = element.getAttribute("data-ticket");
              return raw ? JSON.parse(raw) : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.ticket) return {};
              return { "data-ticket": JSON.stringify(attributes.ticket) };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("ticketTrackingDecorations"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const seenTicketIds = new Set<string>();

            state.doc.descendants((node, pos) => {
              const tracking = node.attrs.ticket as TicketTracking | null;
              // Los nodos "hoja" (ej. imagen) no tienen contentDOM donde
              // anclar el chip; si un ticket empieza justo en una imagen, se
              // excluye igual del análisis (el atributo está para eso),
              // simplemente no dibuja indicador.
              if (
                tracking?.status !== "frozen" ||
                node.isLeaf ||
                seenTicketIds.has(tracking.ticketId)
              )
                return;
              seenTicketIds.add(tracking.ticketId);

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, { class: "ticket-processed" }),
              );
              decorations.push(
                Decoration.widget(pos + 1, () => createTicketChip(tracking), { side: 1 }),
              );
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * `.ticket-tooltip` (invisible sin hover) y `.ticket-tooltip-card` (la
 * tarjeta visible) son DOS elementos separados a propósito: el espacio entre
 * el chip y la tarjeta debe ser `padding` del contenedor invisible (parte de
 * su hitbox), nunca `margin` (hueco muerto que rompería el :hover al mover
 * el cursor hacia la tarjeta). Bug documentado y resuelto en V1.
 */
function createTicketChip(tracking: TicketTracking): HTMLElement {
  const chip = document.createElement("span");
  chip.className = "ticket-chip";
  chip.textContent = "✓ Ticket creado";

  const tooltip = document.createElement("div");
  tooltip.className = "ticket-tooltip";

  const card = document.createElement("div");
  card.className = "ticket-tooltip-card";

  const idLine = document.createElement("p");
  idLine.textContent = `Work Package #${tracking.workPackageId ?? "?"}`;

  const dateLine = document.createElement("p");
  dateLine.textContent = tracking.createdAt ? `Creado el ${formatDate(tracking.createdAt)}` : "";

  const link = document.createElement("a");
  link.className = "ticket-tooltip-link";
  link.textContent = "Abrir en OpenProject";
  link.target = "_blank";
  link.rel = "noopener";
  link.href = tracking.workPackageUrl ?? "#";

  card.append(idLine, dateLine, link);
  tooltip.appendChild(card);
  chip.appendChild(tooltip);
  return chip;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
