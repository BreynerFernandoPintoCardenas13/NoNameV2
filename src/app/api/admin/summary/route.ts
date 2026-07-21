import type { NextRequest } from "next/server";

import * as internalMetricsRepo from "@/modules/admin/repositories/internal-metrics.repository";
import * as membershipsRepo from "@/modules/admin/repositories/memberships.repository";
import * as projectsRepo from "@/modules/admin/repositories/projects.repository";
import * as workPackagesRepo from "@/modules/admin/repositories/work-packages.repository";
import { withAdminAuth } from "@/modules/admin/services/admin-route-helpers";
import type { DashboardSummary } from "@/modules/admin/types";

const OPENPROJECT_UNAVAILABLE_CAVEAT =
  "No disponible temporalmente — error de OpenProject en este rango de fechas";

/** Cards del Dashboard General: el único handler que combina varios repositories (ver ADMIN_ANALYTICS_PLAN.md §6). */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (filters, service): Promise<DashboardSummary> => {
    const [windowCounts, activeProjects, activeOpenProjectUsers, activePms, processedMeetings] =
      await Promise.all([
        workPackagesRepo.getFixedWindowCounts(service, filters),
        projectsRepo.countActiveProjects(service),
        membershipsRepo.countActiveOpenProjectUsers(service),
        internalMetricsRepo.countActivePms(),
        internalMetricsRepo.countProcessedMeetings(),
      ]);

    return {
      stats: [
        {
          id: "tickets-today",
          label: "Tickets creados hoy",
          value: windowCounts.today ?? 0,
          caveat: windowCounts.today === null ? OPENPROJECT_UNAVAILABLE_CAVEAT : undefined,
        },
        {
          id: "tickets-week",
          label: "Tickets esta semana",
          value: windowCounts.week?.current ?? 0,
          changePercent: windowCounts.week?.changePercent ?? undefined,
          caveat: windowCounts.week === null ? OPENPROJECT_UNAVAILABLE_CAVEAT : undefined,
        },
        {
          id: "tickets-month",
          label: "Tickets este mes",
          value: windowCounts.month?.current ?? 0,
          changePercent: windowCounts.month?.changePercent ?? undefined,
          caveat: windowCounts.month === null ? OPENPROJECT_UNAVAILABLE_CAVEAT : undefined,
        },
        {
          id: "estimated-hours-month",
          label: "Horas estimadas este mes",
          value: Math.round(windowCounts.estimatedHoursThisMonth ?? 0),
          unit: "h",
          caveat:
            windowCounts.estimatedHoursThisMonth === null
              ? OPENPROJECT_UNAVAILABLE_CAVEAT
              : undefined,
        },
        { id: "active-projects", label: "Proyectos activos", value: activeProjects },
        {
          id: "active-pms",
          label: "Project Managers activos",
          value: activePms,
          caveat: "Fuente: tabla interna de NoName (role = project_manager)",
        },
        {
          id: "active-users",
          label: "Usuarios activos",
          value: activeOpenProjectUsers,
          caveat: "Cuentas no bloqueadas en OpenProject — no implica actividad reciente",
        },
        {
          id: "meetings-processed",
          label: "Reuniones procesadas",
          value: processedMeetings,
          caveat: "Fuente: ticket_analyses en Supabase, no proviene de OpenProject",
        },
      ],
    };
  });
}
