"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  deleteProject,
  renameProject,
  updateProject,
} from "@/modules/projects/services/projects.service";
import { listProjects } from "@/modules/projects/services/projects.service";
import type { LocalProjectInput } from "@/modules/projects/types";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery({ queryKey: PROJECTS_QUERY_KEY, queryFn: listProjects });
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });

  const create = useMutation({
    mutationFn: (input: LocalProjectInput) => createProject(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: LocalProjectInput }) =>
      updateProject(id, input),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProject(id, name),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: invalidate,
  });

  return { create, update, rename, remove };
}
