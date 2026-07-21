"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** Cards del Dashboard General — barato (conteos/sumas de 1 dimensión), staleTime corto. */
export function useDashboardSummary(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.dashboardSummary(filters),
    queryFn: () => getDashboardSummary(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
