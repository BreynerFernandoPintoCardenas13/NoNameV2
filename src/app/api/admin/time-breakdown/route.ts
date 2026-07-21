import type { NextRequest } from "next/server";

import { getTimeSummary } from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";

/** Horas por proyecto/desarrollador/PM + promedios. */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, (filters) => getTimeSummary(filters));
}
