import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { MeetingBlockView } from "@/modules/notes/components/MeetingBlockView";

/**
 * Un participante de la reunión. `type` es una unión abierta a propósito:
 * en Fase 2 del roadmap original se sumarán MICROSOFT_USER/OPENPROJECT_USER/
 * CLIENT como literales nuevos, nunca como reestructuración del tipo.
 */
export interface MeetingParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: "PROJECT_MANAGER" | "EXTERNAL";
}

/** Único estado posible hoy — unión de un solo valor, lista para crecer. */
export type MeetingBlockStatus = "draft";

export interface MeetingBlockAttrs {
  meetingId: string;
  title: string;
  date: string | null;
  startTime: string | null;
  duration: number | null;
  description: string;
  participants: MeetingParticipant[];
  status: MeetingBlockStatus;
}

export interface MeetingBlockExtensionOptions {
  /**
   * Único punto de contacto entre esta extensión y el resto de la app:
   * abrir el modal de participantes es responsabilidad del editor (que sabe
   * cuál es el proyecto activo y cómo consultar sus Encargados), no de esta
   * extensión.
   */
  onAddParticipant(
    current: MeetingParticipant[],
    onSave: (participants: MeetingParticipant[]) => void,
  ): void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    meetingBlock: {
      /** Inserta un bloque de Reunión vacío en la posición actual, con un `meetingId` nuevo. */
      insertMeetingBlock: () => ReturnType;
    };
  }
}

/**
 * Bloque de Reunión (portado de V1): un Node atómico con campos propios
 * (título, fecha, hora, duración, descripción, participantes), hermano de
 * paragraph/heading/image en el árbol — se selecciona, mueve y persiste
 * igual que los demás bloques. El NodeView imperativo de V1 se reemplaza
 * por un componente React vía ReactNodeViewRenderer.
 */
export const MeetingBlockExtension = Node.create<MeetingBlockExtensionOptions>({
  name: "meetingBlock",
  group: "block",
  atom: true,
  selectable: true,

  addOptions() {
    return {
      onAddParticipant: () => {},
    };
  },

  addAttributes() {
    return {
      meetingId: { default: null },
      title: { default: "" },
      date: { default: null },
      startTime: { default: null },
      duration: { default: null },
      description: { default: "" },
      participants: { default: [] },
      status: { default: "draft" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="meeting-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "meeting-block" })];
  },

  addCommands() {
    return {
      insertMeetingBlock:
        () =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { meetingId: crypto.randomUUID() } })
            .run(),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MeetingBlockView, {
      // Los controles internos manejan sus propios eventos; sin esto
      // ProseMirror los interceptaría como atajos del editor.
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement | null;
        return (
          !!target && ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "LABEL"].includes(target.tagName)
        );
      },
      // Los cambios de DOM internos los genera React y siempre se reflejan
      // vía updateAttributes — ProseMirror no debe reinterpretarlos.
      ignoreMutation: () => true,
    });
  },
});
