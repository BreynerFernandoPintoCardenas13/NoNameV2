"use client";

import { Eyebrow } from "@/components/landing/Eyebrow";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AdminDashboardShell } from "@/modules/admin/components/AdminDashboardShell";
import { DistributionChart } from "@/modules/admin/components/DistributionChart";
import { FilterBar } from "@/modules/admin/components/FilterBar";
import { RankingTable } from "@/modules/admin/components/RankingTable";
import { RecentActivityTable } from "@/modules/admin/components/RecentActivityTable";
import { ReportSectionCard } from "@/modules/admin/components/ReportSectionCard";
import { StatCard } from "@/modules/admin/components/StatCard";
import { ReportSectionSkeleton } from "@/modules/admin/components/skeletons/ReportSectionSkeleton";
import { StatCardSkeleton } from "@/modules/admin/components/skeletons/StatCardSkeleton";
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

/**
 * Panel Administrador — Fase 3: cada sección ya está conectada a su hook
 * (TanStack Query) y muestra datos MOCK reales, con sus propios estados de
 * carga/error. El layout no cambia respecto a la Fase 2; en Fase 4 solo
 * cambia de dónde vienen los datos (`admin-analytics.service.ts`), nunca
 * esta página.
 */
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {dashboardSummary.isLoading
                ? Array.from({ length: 8 }, (_, i) => <StatCardSkeleton key={i} />)
                : dashboardSummary.data?.stats.map((stat) => (
                    <StatCard key={stat.id} stat={stat} />
                  ))}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("ticket-trend")} index={1} featured>
          {ticketTrend.isError ? (
            <SectionError message="No se pudo cargar la tendencia." />
          ) : ticketTrend.isLoading || !ticketTrend.data ? (
            <ReportSectionSkeleton />
          ) : (
            <TrendChart trend={ticketTrend.data} />
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("tickets-by-pm")} index={2}>
          {ticketsByPm.isError ? (
            <SectionError message="No se pudo cargar el ranking." />
          ) : ticketsByPm.isLoading || !ticketsByPm.data ? (
            <ReportSectionSkeleton />
          ) : (
            <div className="flex flex-col gap-4">
              <DistributionChart distribution={ticketsByPm.data} />
              <RankingTable
                items={ticketsByPm.data.map((entry) => ({
                  id: entry.groupId,
                  name: entry.groupName,
                  value: entry.ticketCount,
                  secondaryValue: entry.estimatedHours,
                }))}
                valueLabel="Tickets"
                secondaryLabel="Horas"
              />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("tickets-by-project")} index={3}>
          {ticketsByProject.isError ? (
            <SectionError message="No se pudo cargar el ranking." />
          ) : ticketsByProject.isLoading || !ticketsByProject.data ? (
            <ReportSectionSkeleton />
          ) : (
            <div className="flex flex-col gap-4">
              <DistributionChart distribution={ticketsByProject.data} />
              <RankingTable
                items={ticketsByProject.data.map((entry) => ({
                  id: entry.groupId,
                  name: entry.groupName,
                  value: entry.ticketCount,
                  secondaryValue: entry.estimatedHours,
                }))}
                valueLabel="Tickets"
                secondaryLabel="Horas"
              />
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("developer-ranking")} index={4} featured>
          {developerRanking.isError ? (
            <SectionError message="No se pudo cargar el ranking." />
          ) : developerRanking.isLoading || !developerRanking.data ? (
            <ReportSectionSkeleton />
          ) : (
            <RankingTable
              items={developerRanking.data.map((dev) => ({
                id: dev.id,
                name: dev.name,
                value: dev.ticketCount,
                secondaryValue: dev.estimatedHours,
              }))}
              valueLabel="Tickets"
              secondaryLabel="Horas"
            />
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("time-breakdown")} index={5} featured>
          {timeBreakdown.isError ? (
            <SectionError message="No se pudo cargar el tiempo trabajado." />
          ) : timeBreakdown.isLoading || !timeBreakdown.data ? (
            <ReportSectionSkeleton />
          ) : (
            <TimeBreakdownPanel summary={timeBreakdown.data} />
          )}
        </ReportSectionCard>

        <ReportSectionCard section={getReportSection("recent-activity")} index={6} featured>
          {recentActivity.isError ? (
            <SectionError message="No se pudo cargar la actividad reciente." />
          ) : recentActivity.isLoading || !recentActivity.data ? (
            <ReportSectionSkeleton />
          ) : (
            <RecentActivityTable items={recentActivity.data} />
          )}
        </ReportSectionCard>
      </div>
    </AdminDashboardShell>
  );
}
