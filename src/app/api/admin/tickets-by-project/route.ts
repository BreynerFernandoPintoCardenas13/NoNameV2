import type { NextRequest } from "next/server";

import { groupWorkPackagesBy } from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";

/** `groupBy=project&showSums=true` — agregación servidor. */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, (filters, service) =>
    groupWorkPackagesBy(service, "project", filters),
  );
}
