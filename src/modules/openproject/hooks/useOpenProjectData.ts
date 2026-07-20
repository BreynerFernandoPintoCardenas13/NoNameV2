"use client";

import { useQuery } from "@tanstack/react-query";

import {
  NO_API_KEY_ERROR,
  type Board,
  type BoardColumn,
  type OpenProjectProject,
  type OpenProjectUser,
} from "@/modules/openproject/types";

/** Error específico: el usuario aún no configuró su API Key de OpenProject. */
export class MissingApiKeyError extends Error {
  constructor() {
    super("Configura tu API Key de OpenProject en Configuración para continuar.");
    this.name = "MissingApiKeyError";
  }
}

async function fetchOpenProject<T>(path: string): Promise<T> {
  const res = await fetch(`/api/openproject${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (body?.error === NO_API_KEY_ERROR) throw new MissingApiKeyError();
    throw new Error(body?.error ?? "Error consultando OpenProject.");
  }
  return body as T;
}

/** Los datos de OpenProject cambian poco: caché de 5 min para no golpear la API en cada apertura de modal. */
const STALE_TIME = 5 * 60_000;

export function useOpenProjectProjects(enabled: boolean) {
  return useQuery({
    queryKey: ["openproject", "projects"],
    queryFn: () => fetchOpenProject<OpenProjectProject[]>("/projects"),
    enabled,
    staleTime: STALE_TIME,
    retry: (count, error) => !(error instanceof MissingApiKeyError) && count < 2,
  });
}

export function useOpenProjectBoards(openProjectId: number | null) {
  return useQuery({
    queryKey: ["openproject", "boards", openProjectId],
    queryFn: () => fetchOpenProject<Board[]>(`/projects/${openProjectId}/boards`),
    enabled: openProjectId !== null,
    staleTime: STALE_TIME,
  });
}

export function useOpenProjectBoardColumns(boardId: number | null) {
  return useQuery({
    queryKey: ["openproject", "columns", boardId],
    queryFn: () => fetchOpenProject<BoardColumn[]>(`/boards/${boardId}/columns`),
    enabled: boardId !== null,
    staleTime: STALE_TIME,
  });
}

export function useAssignableUsers(openProjectId: number | null) {
  return useQuery({
    queryKey: ["openproject", "assignable", openProjectId],
    queryFn: () =>
      fetchOpenProject<OpenProjectUser[]>(`/projects/${openProjectId}/assignable-users`),
    enabled: openProjectId !== null,
    staleTime: STALE_TIME,
  });
}

export function useResponsibleUsers(openProjectId: number | null) {
  return useQuery({
    queryKey: ["openproject", "responsible", openProjectId],
    queryFn: () =>
      fetchOpenProject<OpenProjectUser[]>(`/projects/${openProjectId}/responsible-users`),
    enabled: openProjectId !== null,
    staleTime: STALE_TIME,
  });
}
