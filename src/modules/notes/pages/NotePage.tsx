"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { getNote } from "@/modules/notes/services/notes.service";

export const noteQueryKey = (noteId: string) => ["note", noteId] as const;

/**
 * Página de una nota. En Fase 1 muestra los datos básicos; el editor TipTap
 * llega en Fase 2 y reemplaza el cuerpo de esta misma página.
 */
export function NotePage({ noteId }: { noteId: string }) {
  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: noteQueryKey(noteId),
    queryFn: () => getNote(noteId),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label="Cargando nota" />
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="No se pudo abrir la nota"
          description="Puede que haya sido eliminada o que no tengas acceso."
          className="w-full max-w-sm border-none"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 px-8 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {note.title || <span className="text-muted-foreground italic">Sin título</span>}
      </h1>
      <p className="text-muted-foreground text-sm">
        El editor de notas llega en la Fase 2 de la migración. La nota ya existe y es tuya: creada
        el {new Date(note.createdAt).toLocaleDateString("es-CO")}.
      </p>
    </div>
  );
}
