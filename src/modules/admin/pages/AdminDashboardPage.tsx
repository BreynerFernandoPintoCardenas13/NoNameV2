"use client";

import { Eyebrow } from "@/components/landing/Eyebrow";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AdminDashboardShell } from "@/modules/admin/components/AdminDashboardShell";
import { DeveloperRankingList } from "@/modules/admin/components/DeveloperRankingList";
import { DistributionChart } from "@/modules/admin/components/DistributionChart";
import { FilterBar } from "@/modules/admin/components/FilterBar";
import { RecentActivityTable } from "@/modules/admin/components/RecentActivityTable";
import { ReportSectionCard } from "@/modules/admin/components/ReportSectionCard";
import { StatCard } from "@/modules/admin/components/StatCard";
import { ActivityTableSkeleton } from "@/modules/admin/components/skeletons/ActivityTableSkeleton";
import { BarChartSkeleton } from "@/modules/admin/components/skeletons/BarChartSkeleton";
import { LineChartSkeleton } from "@/modules/admin/components/skeletons/LineChartSkeleton";
import { RankingListSkeleton } from "@/modules/admin/components/skeletons/RankingListSkeleton";
import { StatCardSkeleton } from "@/modules/admin/components/skeletons/StatCardSkeleton";
import { TimeBreakdownSkeleton } from "@/modules/admin/components/skeletons/TimeBreakdownSkeleton";
import { TimeBreakdownPanel } from "@/modules/admin/components/TimeBreakdownPanel";
import { TrendChart } from "@/modules/admin/components/TrendChart";
import { useAdminFilters } from "@/modules/admin/hooks/useAdminFilters";
import { useDashboardSummary } from "@/modules/admin/hooks/useDashboardSummary";
import { useDeveloperRanking } from "@/modules/admin/hooks/useDeveloperRanking";
import { useRecentActivity } from "@/modules/admin/hooks/useRecentActivity";
import { useTicketTrend } from "@/modules/admin/hooks/useTicketTrend";
import { useTicketsByPm } from "@/modules/admin/hooks/useTicketsByPm";
import { useTicketsByProject } from "@/modules/admin/hooks/useTicketsByProject";
import { useTimeBreakdown } from "@/modules/admin/hooks/useTimeBreakdown";
import { getReportSection } from "@/modules/admin/utils/report-sections";

/** Texto de error uniforme para cualquier sección — un solo lugar, sin duplicar el markup 7 veces. */
function SectionError({ message }: { message: string }) {
  return <p className="text-destructive py-6 text-center text-sm">{message}</p>;
}

/** Atenúa el contenido mientras TanStack Query refetchea en segundo plano (cambio de filtros) sin mostrar el skeleton de nuevo. */
function fetchingClass(isFetching: boolean): string {
  return cn("transition-opacity duration-300", isFetching && "opacity-60");
}

/** Panel Administrador — Fase 5: cada sección ya renderiza visualizaciones reales (Recharts) sobre datos de OpenProject. */
export function AdminDashboardPage() {
  const { filters, setFilters, resetFilters } = useAdminFilters();

  const dashboardSummary = useDashboardSummary(filters);
  const ticketTrend = useTicketTrend(filters);
  const ticketsByPm = useTicketsByPm(filters);
  const ticketsByProject = useTicketsByProject(filters);
  const developerRanking = useDeveloperRanking(filters);
  const timeBreakdown = useTimeBreakdown(filters);
  const recentActivity = useRecentActivity(filters);

  return (
    <AdminDashboardShell>
      <header className="mb-8 max-w-2xl">
        <Eyebrow>ANALÍTICA</Eyebrow>
        <h1
          className={cn(
            playfair.className,
            "mt-3 text-[clamp(28px,4vw,42px)] leading-[1.1] font-semibold tracking-[-0.01em] text-[#f7f7f7]",
          )}
        >
          Panel Administrador
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-white/55">
          Centro de analítica de OpenProject: productividad, carga de trabajo, tendencias y
          desempeño por proyecto, desarrollador y Project Manager.
        </p>
      </header>

      <FilterBar filters={filters} onChange={setFilters} onReset={resetFilters} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <ReportSectionCard section={getReportSection("dashboard-general")} index={0} featured>
          {dashboardSummary.isError ? (
            <SectionError message="No se pudo cargar el resumen." />
          ) : (
            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:grid-cols-4",
                fetchingClass(dashboardSummary.isFetching && !dashboardSummary.isLoading),
              )}
            >
              {dashboardSummary.isLoading
                ? Array.from({ length: 8 }, (_, i) => <StatCardSkeleton key={i} />)
                : dashboardSummary.data?.stats.map((stat, i) => (
                    <StatCard key={stat.id} stat={stat} index={i} />
                  ))}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("ticket-trend")} index={1} featured>
          {ticketTrend.isError ? (
            <SectionError message="No se pudo cargar la tendencia." />
          ) : ticketTrend.isLoading || !ticketTrend.data ? (
            <LineChartSkeleton />
          ) : (
            <div className={fetchingClass(ticketTrend.isFetching)}>
              <TrendChart trend={ticketTrend.data} />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("tickets-by-pm")} index={2}>
          {ticketsByPm.isError ? (
            <SectionError message="No se pudo cargar el ranking." />
          ) : ticketsByPm.isLoading || !ticketsByPm.data ? (
            <BarChartSkeleton orientation="columns" />
          ) : (
            <div className={fetchingClass(ticketsByPm.isFetching)}>
              <DistributionChart
                data={ticketsByPm.data.map((entry) => ({
                  id: entry.groupId,
                  name: entry.groupName,
                  value: entry.ticketCount,
                  secondaryValue: entry.estimatedHours,
                }))}
                orientation="columns"
                valueLabel="Tickets"
                secondaryLabel="Horas"
                secondarySuffix="h"
                emptyLabel="No hay tickets agrupados por PM para este rango de filtros."
              />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("tickets-by-project")} index={3}>
          {ticketsByProject.isError ? (
            <SectionError message="No se pudo cargar el ranking." />
          ) : ticketsByProject.isLoading || !ticketsByProject.data ? (
            <BarChartSkeleton orientation="horizontal" />
          ) : (
            <div className={fetchingClass(ticketsByProject.isFetching)}>
              <DistributionChart
                data={ticketsByProject.data.map((entry) => ({
                  id: entry.groupId,
                  name: entry.groupName,
                  value: entry.ticketCount,
                  secondaryValue: entry.estimatedHours,
                }))}
                orientation="horizontal"
                valueLabel="Tickets"
                secondaryLabel="Horas"
                secondarySuffix="h"
                emptyLabel="No hay tickets agrupados por proyecto para este rango de filtros."
              />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("developer-ranking")} index={4} featured>
          {developerRanking.isError ? (
            <SectionError message="No se pudo cargar el ranking." />
          ) : developerRanking.isLoading || !developerRanking.data ? (
            <RankingListSkeleton />
          ) : (
            <div className={fetchingClass(developerRanking.isFetching)}>
              <DeveloperRankingList items={developerRanking.data} />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("time-breakdown")} index={5} featured>
          {timeBreakdown.isError ? (
            <SectionError message="No se pudo cargar el tiempo trabajado." />
          ) : timeBreakdown.isLoading || !timeBreakdown.data ? (
            <TimeBreakdownSkeleton />
          ) : (
            <div className={fetchingClass(timeBreakdown.isFetching)}>
              <TimeBreakdownPanel summary={timeBreakdown.data} />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("recent-activity")} index={6} featured>
          {recentActivity.isError ? (
            <SectionError message="No se pudo cargar la actividad reciente." />
          ) : recentActivity.isLoading || !recentActivity.data ? (
            <ActivityTableSkeleton />
          ) : (
            <div className={fetchingClass(recentActivity.isFetching)}>
              <RecentActivityTable items={recentActivity.data} />
            </div>
          )}
        </ReportSectionCard>
      </div>
    </AdminDashboardShell>
  );
}
