"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createManager,
  deleteManager,
  listManagers,
  updateManager,
  type ManagerInput,
} from "@/modules/projects/services/managers.service";

export const managersQueryKey = (projectId: string) => ["managers", projectId] as const;

/** Encargados de un proyecto (consulta perezosa: `enabled` cuando hay proyecto). */
export function useManagers(projectId: string | null) {
  return useQuery({
    queryKey: managersQueryKey(projectId ?? "none"),
    queryFn: () => listManagers(projectId!),
    enabled: projectId !== null,
  });
}

export function useManagerMutations(projectId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    if (projectId) queryClient.invalidateQueries({ queryKey: managersQueryKey(projectId) });
  };

  const create = useMutation({
    mutationFn: (input: ManagerInput) => createManager(projectId!, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ManagerInput }) => updateManager(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteManager(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
