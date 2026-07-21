"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getTicketsByPm } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** `groupBy=responsible&showSums=true` — agregación servidor, staleTime corto. */
export function useTicketsByPm(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.ticketsByPm(filters),
    queryFn: () => getTicketsByPm(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
