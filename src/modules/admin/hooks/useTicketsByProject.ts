"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getTicketsByProject } from "@/modules/admin/services/admin-analytics.service";
import { adminQueryKeys } from "@/modules/admin/utils/admin-query-keys";
import type { AdminFilters } from "@/modules/admin/types";

/** `groupBy=project&showSums=true` — agregación servidor, staleTime corto. */
export function useTicketsByProject(filters: AdminFilters) {
  return useQuery({
    queryKey: adminQueryKeys.ticketsByProject(filters),
    queryFn: () => getTicketsByProject(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
