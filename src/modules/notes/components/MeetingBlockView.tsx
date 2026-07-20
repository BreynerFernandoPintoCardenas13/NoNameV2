"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { CalendarClock, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  MeetingBlockAttrs,
  MeetingBlockExtensionOptions,
  MeetingParticipant,
} from "@/modules/notes/editor/extensions/meeting-block";

/**
 * NodeView React del bloque de Reunión. Cada control escribe directo en los
 * attrs del nodo (`updateAttributes`) — el documento es la única fuente de
 * verdad, igual que en V1.
 */
export function MeetingBlockView({ node, updateAttributes, extension }: ReactNodeViewProps) {
  const attrs = node.attrs as MeetingBlockAttrs;
  const options = extension.options as MeetingBlockExtensionOptions;

  const patch = (changes: Partial<MeetingBlockAttrs>) => updateAttributes(changes);

  return (
    <NodeViewWrapper
      data-type="meeting-block"
      className="border-border/70 bg-muted/30 my-2 flex flex-col gap-3 rounded-xl border p-4"
      contentEditable={false}
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <input
          type="text"
          placeholder="Título de la reunión"
          value={attrs.title ?? ""}
          onChange={(e) => patch({ title: e.target.value })}
          className="placeholder:text-muted-foreground/60 w-full bg-transparent text-sm font-medium outline-none"
          aria-label="Título de la reunión"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Fecha
          <Input
            type="date"
            value={attrs.date ?? ""}
            onChange={(e) => patch({ date: e.target.value || null })}
            className="h-8"
          />
        </label>
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Hora inicio
          <Input
            type="time"
            value={attrs.startTime ?? ""}
            onChange={(e) => patch({ startTime: e.target.value || null })}
            className="h-8"
          />
        </label>
        <label className="text-muted-foreground flex flex-col gap-1 text-xs">
          Duración (min)
          <Input
            type="number"
            min={0}
            step={5}
            placeholder="Ej. 30"
            value={attrs.duration != null ? String(attrs.duration) : ""}
            onChange={(e) => patch({ duration: e.target.value ? Number(e.target.value) : null })}
            className="h-8"
          />
        </label>
      </div>

      <Textarea
        placeholder="Descripción (opcional)"
        rows={2}
        value={attrs.description ?? ""}
        onChange={(e) => patch({ description: e.target.value })}
        className="min-h-0 resize-none text-sm"
        aria-label="Descripción de la reunión"
      />

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">Participantes</p>
        {attrs.participants?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attrs.participants.map((participant: MeetingParticipant) => (
              <span
                key={participant.id}
                className="border-border/70 bg-background/60 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs"
              >
                <span aria-hidden="true">
                  {participant.type === "PROJECT_MANAGER" ? "👤" : "✉️"}
                </span>
                {participant.name}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            options.onAddParticipant(attrs.participants ?? [], (participants) =>
              patch({ participants }),
            )
          }
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-xs transition-colors"
        >
          <Plus className="size-3.5" aria-hidden="true" /> Agregar participante
        </button>
      </div>
    </NodeViewWrapper>
  );
}
