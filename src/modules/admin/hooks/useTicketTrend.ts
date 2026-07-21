"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getTicketTrend } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** Tendencia de tickets — exige fetch+bucketing (sin agregación temporal nativa), staleTime largo. */
export function useTicketTrend(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.ticketTrend(filters),
    queryFn: () => getTicketTrend(filters),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });
}
