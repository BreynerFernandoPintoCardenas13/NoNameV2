"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DistributionChart } from "@/modules/admin/components/DistributionChart";
import { useShowMore } from "@/modules/admin/hooks/useShowMore";
import type { TimeBreakdownEntry, TimeSummary } from "@/modules/admin/types";

function ShowMoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="mt-2 h-7 px-2 text-[12px] text-white/50 hover:text-white/80"
    >
      Ver más ({remaining} restantes)
    </Button>
  );
}

/** Lista simple (sin gráfica) — con demasiados grupos, una torta/barra deja de ser legible. */
function BreakdownList({ title, entries }: { title: string; entries: TimeBreakdownEntry[] }) {
  const { visible, hasMore, showMore, remaining } = useShowMore(entries, 10, 10);

  return (
    <div>
      <p className="mb-2 text-[12.5px] font-medium text-white/70">{title}</p>
      {entries.length === 0 ? (
        <p className="text-[13px] text-white/35">Sin datos para este rango.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {visible.map((entry) => (
              <li
                key={entry.groupId}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="truncate text-white/70">{entry.groupName}</span>
                <span className="shrink-0 text-white/45">{entry.estimatedHours} h</span>
              </li>
            ))}
          </ul>
          {hasMore && <ShowMoreButton remaining={remaining} onClick={showMore} />}
        </>
      )}
    </div>
  );
}

/** Horas por proyecto — BarChart (§7), paginado igual que las listas: demasiados proyectos vuelven el chart ilegible de una sola vez. */
function ProjectHoursChart({ entries }: { entries: TimeBreakdownEntry[] }) {
  const { visible, hasMore, showMore, remaining } = useShowMore(entries, 10, 10);
  const data = React.useMemo(
    () =>
      visible.map((entry) => ({
        id: entry.groupId,
        name: entry.groupName,
        value: entry.estimatedHours,
        secondaryValue: entry.averageHoursPerTicket,
      })),
    [visible],
  );

  return (
    <div>
      <p className="mb-3 text-[12.5px] font-medium text-white/70">Horas por proyecto</p>
      <DistributionChart
        data={data}
        orientation="horizontal"
        valueLabel="Horas"
        valueSuffix="h"
        secondaryLabel="Promedio/ticket"
        secondarySuffix="h"
        emptyLabel="No hay horas estimadas para este rango de filtros."
      />
      {hasMore && <ShowMoreButton remaining={remaining} onClick={showMore} />}
    </div>
  );
}

/** Tiempo trabajado: distribución por proyecto (lista + bar chart, ambos paginados) + promedios/desarrollador/PM. */
export function TimeBreakdownPanel({ summary }: { summary: TimeSummary }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-8">
        <div>
          <p className="text-xl font-semibold tracking-tight text-[#f7f7f7]">
            {summary.averageHoursPerTicket.toFixed(1)}h
          </p>
          <p className="text-[11.5px] text-white/45">promedio por ticket</p>
        </div>
        <div>
          <p className="text-xl font-semibold tracking-tight text-[#f7f7f7]">
            {summary.averageHoursPerProject.toFixed(1)}h
          </p>
          <p className="text-[11.5px] text-white/45">promedio por proyecto</p>
        </div>
      </div>

      <BreakdownList title="Distribución de horas por proyecto" entries={summary.byProject} />

      <ProjectHoursChart entries={summary.byProject} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <BreakdownList title="Por desarrollador" entries={summary.byDeveloper} />
        <BreakdownList title="Por Project Manager" entries={summary.byPm} />
      </div>
    </div>
  );
}
