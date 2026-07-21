"use client";

import type { Editor } from "@tiptap/core";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { notesQueryKey } from "@/modules/notes/hooks/useNotes";
import { updateNote } from "@/modules/notes/services/notes.service";

/** Misma ventana de debounce que V1: cada tecleo reprograma, 600 ms de silencio disparan el PATCH. */
const AUTOSAVE_DEBOUNCE_MS = 600;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Autoguardado de una nota (título + documento). El guardado espera 600 ms
 * de silencio; la sincronización del título con la sidebar es aparte e
 * instantánea (invalidación de la query de notas al guardar).
 */
export function useNoteAutosave(editor: Editor | null, noteId: string, projectId: string | null) {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const titleRef = React.useRef<string>("");
  /** El primer setContent al abrir la nota no debe disparar un guardado. */
  const suppressRef = React.useRef(false);

  const flush = React.useCallback(() => {
    if (!editor) return;
    setStatus("saving");
    updateNote(noteId, { title: titleRef.current, document: editor.getJSON() })
      .then(() => {
        setStatus("saved");
        if (projectId) queryClient.invalidateQueries({ queryKey: notesQueryKey(projectId) });
      })
      .catch(() => setStatus("error"));
  }, [editor, noteId, projectId, queryClient]);

  const schedule = React.useCallback(() => {
    if (suppressRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
  }, [flush]);

  React.useEffect(() => {
    if (!editor) return;
    const onUpdate = () => schedule();
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      clearTimeout(timeoutRef.current);
    };
  }, [editor, schedule]);

  return {
    status,
    /** Actualiza el título en memoria y programa el guardado. */
    onTitleChange: (title: string) => {
      titleRef.current = title;
      schedule();
    },
    /** Fija el título inicial sin disparar guardado. */
    seedTitle: (title: string) => {
      titleRef.current = title;
    },
    /** Ejecuta `fn` (p. ej. setContent) sin que el "update" resultante dispare autoguardado. */
    withoutAutosave: (fn: () => void) => {
      suppressRef.current = true;
      try {
        fn();
      } finally {
        suppressRef.current = false;
      }
    },
  };
}
