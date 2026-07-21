"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { adminFiltersSchema } from "@/modules/admin/schemas/admin-filters.schema";
import type { AdminFilters } from "@/modules/admin/types";

const DEFAULT_FILTERS: AdminFilters = {
  dateFrom: null,
  dateTo: null,
  projectId: null,
  userId: null,
  pmId: null,
  developerId: null,
  ticketType: null,
};

function parseFilters(params: URLSearchParams): AdminFilters {
  const raw = {
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    projectId: params.get("projectId") ?? undefined,
    userId: params.get("userId") ?? undefined,
    pmId: params.get("pmId") ?? undefined,
    developerId: params.get("developerId") ?? undefined,
    ticketType: params.get("ticketType") ?? undefined,
  };
  const parsed = adminFiltersSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_FILTERS;
}

/**
 * Estado único de filtros globales, serializado en la URL (ver
 * ADMIN_ANALYTICS_PLAN.md §14) — compartible/recargable, y cada combinación
 * de filtros es automáticamente una entrada de caché distinta en TanStack
 * Query (los hooks de datos incluyen `filters` en su query key).
 */
export function useAdminFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(() => parseFilters(searchParams), [searchParams]);

  const setFilters = React.useCallback(
    (patch: Partial<AdminFilters>) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged = { ...filters, ...patch };
      for (const [key, value] of Object.entries(merged)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [filters, pathname, router, searchParams],
  );

  const resetFilters = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { filters, setFilters, resetFilters };
}
