"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import dynamic from "next/dynamic";

import { EmptyState } from "@/components/shared/empty-state";
import { KnowledgePanel } from "@/modules/knowledge/components/KnowledgePanel";
import { getNote } from "@/modules/notes/services/notes.service";
import { useProjects } from "@/modules/projects/hooks/useProjects";

// Code splitting real: el bundle de Tiptap/ProseMirror solo se descarga al
// abrir una nota, nunca en landing/login/dashboard.
const NoteEditor = dynamic(
  () => import("@/modules/notes/components/NoteEditor").then((m) => m.NoteEditor),
  { ssr: false },
);

export const noteQueryKey = (noteId: string) => ["note", noteId] as const;

/** Página de una nota: carga el documento completo y monta el editor. */
export function NotePage({ noteId }: { noteId: string }) {
  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: noteQueryKey(noteId),
    queryFn: () => getNote(noteId),
  });
  const { data: projects } = useProjects();

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

  const project = projects?.find((p) => p.id === note.projectId) ?? null;

  // key={note.id}: cambiar de nota remonta el editor completo (contenido
  // inicial nuevo, autosave limpio) — mismo efecto que `openNote` en V1.
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <NoteEditor key={note.id} note={note} openProjectId={project?.openProjectId ?? null} />
      </div>
      <KnowledgePanel projectId={note.projectId} />
    </div>
  );
}
