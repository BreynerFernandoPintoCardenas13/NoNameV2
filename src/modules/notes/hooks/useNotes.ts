"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createNote,
  deleteNote,
  listNotesByProject,
  updateNote,
} from "@/modules/notes/services/notes.service";

export const notesQueryKey = (projectId: string) => ["notes", projectId] as const;

/**
 * Notas de un proyecto para el árbol de la sidebar. Carga perezosa: la
 * query solo corre cuando el proyecto se expande (`enabled`), reproduciendo
 * el `notesByProject` de V1 con la caché de TanStack Query.
 */
export function useNotes(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: notesQueryKey(projectId),
    queryFn: () => listNotesByProject(projectId),
    enabled,
  });
}

export function useNoteMutations(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: notesQueryKey(projectId) });

  const create = useMutation({
    mutationFn: () => createNote(projectId),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateNote(id, { title }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: invalidate,
  });

  return { create, rename, remove };
}
