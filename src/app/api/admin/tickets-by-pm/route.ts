import type { NextRequest } from "next/server";

import { groupWorkPackagesBy } from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";

/** `groupBy=responsible&showSums=true` — agregación servidor (ver ADMIN_ANALYTICS_PLAN.md §14: PM → responsible). */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, (filters) => groupWorkPackagesBy("responsible", filters));
}
