import type { NextRequest } from "next/server";

import { getTicketTrend } from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";

/** Tendencia de tickets: fetch + bucketing propio (OpenProject no agrupa por fecha). */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, (filters) => getTicketTrend(filters));
}
