"use client";

import { useQuery } from "@tanstack/react-query";

import { getCurrentAppUser } from "@/modules/auth/services/auth.service";

export const CURRENT_USER_QUERY_KEY = ["auth", "current-user"] as const;

/** Usuario de la sesión actual (null si no hay sesión). Cacheado con React Query. */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentAppUser,
    staleTime: 60_000,
  });
}
