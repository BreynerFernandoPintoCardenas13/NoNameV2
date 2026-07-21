"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getTimeSummary } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** Horas por proyecto/dev/PM + promedios — puede depender de time_entries (fetch+suma), staleTime largo. */
export function useTimeBreakdown(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.timeBreakdown(filters),
    queryFn: () => getTimeSummary(filters),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });
}
