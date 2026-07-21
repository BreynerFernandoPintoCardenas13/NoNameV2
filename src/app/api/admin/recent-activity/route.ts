import type { NextRequest } from "next/server";

import { listRecentlyUpdatedWorkPackages } from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";

/** Tickets actualizados recientemente (no un log de auditoría — ver ADMIN_ANALYTICS_PLAN.md §8, riesgo 5). */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, (filters) => listRecentlyUpdatedWorkPackages(filters));
}
