"use client";

import type { Editor } from "@tiptap/core";
import { CalendarDays, Plus, Timer, UserRound } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MetadataDialogKind } from "@/modules/notes/components/MetadataDialogs";

interface BlockPlusButtonProps {
  editor: Editor | null;
  /** Contenedor relativo respecto al cual se posiciona el botón. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPickMetadata: (kind: Exclude<MetadataDialogKind, null>) => void;
  /** Acciones extra del menú (p. ej. "Reunión" en Fase 3). */
  extraItems?: { label: string; icon: React.ReactNode; onSelect: () => void }[];
}

/** Devuelve la posición del bloque de texto donde está el cursor, o null. */
function findBlockPos(editor: Editor): number | null {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if (["paragraph", "heading"].includes($from.node(depth).type.name)) {
      return $from.before(depth);
    }
  }
  return null;
}

/**
 * Botón "+" flotante al margen del bloque activo (portado de V1): aparece de
 * inmediato en cuanto el cursor está en un bloque y se reposiciona en cada
 * cambio de línea — agregar Asignado/Fecha/Tiempo debe ser instantáneo
 * durante una reunión.
 */
export function BlockPlusButton({
  editor,
  containerRef,
  onPickMetadata,
  extraItems,
}: BlockPlusButtonProps) {
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (!editor) return;

    const reposition = () => {
      const pos = findBlockPos(editor);
      const dom = pos !== null ? (editor.view.nodeDOM(pos) as HTMLElement | null) : null;
      const container = containerRef.current;
      if (!dom || !container) {
        setPosition(null);
        return;
      }
      const blockRect = dom.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setPosition({
        top: blockRect.top - containerRect.top,
        left: blockRect.left - containerRect.left - 34,
      });
    };

    const hide = ({ event }: { event: FocusEvent }) => {
      // No ocultar si el foco pasó al propio botón/menú.
      const related = event.relatedTarget as Node | null;
      if (related && containerRef.current?.contains(related)) return;
      setPosition(null);
    };

    editor.on("selectionUpdate", reposition);
    editor.on("update", reposition);
    editor.on("focus", reposition);
    editor.on("blur", hide);
    return () => {
      editor.off("selectionUpdate", reposition);
      editor.off("update", reposition);
      editor.off("focus", reposition);
      editor.off("blur", hide);
    };
  }, [editor, containerRef]);

  if (!position) return null;

  return (
    <div className="absolute z-10" style={{ top: position.top, left: Math.max(position.left, 0) }}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Agregar metadato al bloque"
              className="text-muted-foreground hover:text-foreground rounded-full border border-transparent hover:border-current/20"
            />
          }
        >
          <Plus />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom">
          <DropdownMenuItem onClick={() => onPickMetadata("assignee")}>
            <UserRound /> Asignado a…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPickMetadata("estimatedTime")}>
            <Timer /> Tiempo de trabajo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPickMetadata("dueDate")}>
            <CalendarDays /> Fecha límite
          </DropdownMenuItem>
          {extraItems?.map((item) => (
            <DropdownMenuItem key={item.label} onClick={item.onSelect}>
              {item.icon} {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
