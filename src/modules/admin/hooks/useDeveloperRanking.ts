"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getDeveloperRanking } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** "Más proyectos"/"carga" exigen cruce assignee×project sin equivalente nativo — staleTime largo. */
export function useDeveloperRanking(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.developerRanking(filters),
    queryFn: () => getDeveloperRanking(filters),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });
}
