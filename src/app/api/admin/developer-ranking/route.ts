import type { NextRequest } from "next/server";

import { getDeveloperRanking } from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";

/** Ranking de desarrolladores: tickets, horas, proyectos distintos y carga compuesta. */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, (filters) => getDeveloperRanking(filters));
}
