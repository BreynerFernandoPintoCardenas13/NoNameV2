"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as React from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { BlockPlusButton } from "@/modules/notes/components/BlockPlusButton";
import { EditorBubbleMenu } from "@/modules/notes/components/EditorBubbleMenu";
import {
  MetadataDialogs,
  type MetadataDialogKind,
} from "@/modules/notes/components/MetadataDialogs";
import { BlockMetadataExtension } from "@/modules/notes/editor/extensions/block-metadata";
import { TicketTrackingExtension } from "@/modules/notes/editor/extensions/ticket-tracking";
import type { MetadataRegistry } from "@/modules/notes/editor/metadata/types";
import { useNoteAutosave } from "@/modules/notes/hooks/useNoteAutosave";
import { uploadNoteImage } from "@/modules/notes/services/note-images.service";
import type { MeetingNote } from "@/modules/notes/types";

import "@/modules/notes/editor/editor.css";

interface NoteEditorProps {
  note: MeetingNote;
  /** Proyecto de OpenProject vinculado al proyecto de la nota (para "Asignado a"). */
  openProjectId: number | null;
  /** Acciones extra del menú "+" (Fase 3: bloque de Reunión). */
  extraPlusItems?: React.ComponentProps<typeof BlockPlusButton>["extraItems"];
  /** Cabecera derecha (Fase 4: botón "Crear Tickets"). */
  headerActions?: React.ReactNode;
}

const SAVE_LABEL: Record<string, string> = {
  idle: "",
  saving: "Guardando…",
  saved: "Guardado",
  error: "No se pudo guardar",
};

/**
 * Editor de notas de reunión (port React del editor de V1): título estilo
 * Notion, Tiptap con metadatos por bloque y seguimiento de tickets,
 * imágenes a Supabase Storage, autoguardado con debounce de 600 ms.
 */
export function NoteEditor({
  note,
  openProjectId,
  extraPlusItems,
  headerActions,
}: NoteEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dialogKind, setDialogKind] = React.useState<MetadataDialogKind>(null);

  // El registry se crea una sola vez: los chips reabren el mismo modal que
  // el menú "+", tanto para fijar por primera vez como para editar.
  const registry = React.useMemo<MetadataRegistry>(
    () => ({
      assignee: {
        icon: "👤",
        label: (item) => (item.name as string) ?? "Sin asignar",
        onClick: () => setDialogKind("assignee"),
      },
      estimatedTime: {
        icon: "⏱",
        label: (item) => `${item.value} h`,
        onClick: () => setDialogKind("estimatedTime"),
      },
      dueDate: {
        icon: "📅",
        label: (item) => item.value as string,
        onClick: () => setDialogKind("dueDate"),
      },
    }),
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      // allowBase64: los documentos migrados de V1 pueden traer data-URLs viejos.
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: "Escribe aquí tus notas de la reunión…" }),
      BlockMetadataExtension.configure({ registry }),
      TicketTrackingExtension,
    ],
    content: note.document,
    autofocus: "end",
    editorProps: {
      handlePaste: (_view, event) => {
        const file = [...(event.clipboardData?.files ?? [])].find((f) =>
          f.type.startsWith("image/"),
        );
        if (!file) return false;
        event.preventDefault();
        void insertImage(file);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = [...(event.dataTransfer?.files ?? [])].find((f) =>
          f.type.startsWith("image/"),
        );
        if (!file) return false;
        event.preventDefault();
        void insertImage(file);
        return true;
      },
    },
  });

  const autosave = useNoteAutosave(editor, note.id, note.projectId);

  React.useEffect(() => {
    autosave.seedTitle(note.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar la nota
  }, [note.id]);

  /** Sube la imagen a Storage e inserta su URL firmada (nunca base64 nuevo). */
  async function insertImage(file: File) {
    try {
      const url = await uploadNoteImage(note.id, file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
  }

  return (
    <div className="note-editor mx-auto flex h-full max-w-3xl flex-col px-8 py-8">
      <div className="mb-1 flex items-center justify-between gap-4">
        <p
          className={cn(
            "text-muted-foreground min-h-4 text-xs transition-opacity",
            autosave.status === "error" && "text-destructive",
          )}
          role="status"
          aria-live="polite"
        >
          {SAVE_LABEL[autosave.status]}
        </p>
        {headerActions}
      </div>

      {/* Título estilo Notion: div editable, Enter pasa el foco al cuerpo. */}
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Título de la nota"
        data-placeholder="Sin título"
        className="note-title text-3xl font-semibold tracking-tight outline-none"
        onInput={(e) => autosave.onTitleChange(e.currentTarget.textContent ?? "")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editor?.commands.focus("start");
          }
        }}
      >
        {note.title}
      </div>

      <div ref={containerRef} className="relative mt-6 flex-1 pl-9">
        <BlockPlusButton
          editor={editor}
          containerRef={containerRef}
          onPickMetadata={setDialogKind}
          extraItems={extraPlusItems}
        />
        {editor && <EditorBubbleMenu editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      <MetadataDialogs
        editor={editor}
        kind={dialogKind}
        onClose={() => setDialogKind(null)}
        openProjectId={openProjectId}
      />
    </div>
  );
}
