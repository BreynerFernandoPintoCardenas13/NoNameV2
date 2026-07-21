"use client";

import { useQuery } from "@tanstack/react-query";

import { getFilterOptions } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";

/** Opciones de `FilterBar` (proyectos/PMs/desarrolladores) — cambian poco, staleTime largo. */
export function useFilterOptions() {
  return useQuery({
    queryKey: adminQueryKeys.filterOptions(),
    queryFn: () => getFilterOptions(),
    staleTime: 300_000,
  });
}
