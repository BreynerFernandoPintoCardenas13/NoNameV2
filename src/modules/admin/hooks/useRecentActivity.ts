"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getRecentActivity } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** Tickets actualizados recientemente (no es un log de auditoría — ver §8, riesgo 5). staleTime corto. */
export function useRecentActivity(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.recentActivity(filters),
    queryFn: () => getRecentActivity(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
