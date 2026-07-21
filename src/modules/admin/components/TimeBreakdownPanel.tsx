import { DistributionChart } from "@/modules/admin/components/DistributionChart";
import { TimeDistributionDonut } from "@/modules/admin/components/TimeDistributionDonut";
import type { TimeBreakdownEntry, TimeSummary } from "@/modules/admin/types";

function BreakdownList({ title, entries }: { title: string; entries: TimeBreakdownEntry[] }) {
  return (
    <div>
      <p className="mb-2 text-[12.5px] font-medium text-white/70">{title}</p>
      {entries.length === 0 ? (
        <p className="text-[13px] text-white/35">Sin datos para este rango.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <li key={entry.groupId} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="truncate text-white/70">{entry.groupName}</span>
              <span className="shrink-0 text-white/45">{entry.estimatedHours} h</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tiempo trabajado: distribución (donut, §6) + horas por proyecto (bar chart, §7) + promedios/desarrollador/PM. */
export function TimeBreakdownPanel({ summary }: { summary: TimeSummary }) {
  const projectHours = summary.byProject.map((entry) => ({
    id: entry.groupId,
    name: entry.groupName,
    value: entry.estimatedHours,
    secondaryValue: entry.averageHoursPerTicket,
  }));

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

      <div>
        <p className="mb-3 text-[12.5px] font-medium text-white/70">
          Distribución de horas por proyecto
        </p>
        <TimeDistributionDonut entries={summary.byProject} />
      </div>

      <div>
        <p className="mb-3 text-[12.5px] font-medium text-white/70">Horas por proyecto</p>
        <DistributionChart
          data={projectHours}
          orientation="horizontal"
          valueLabel="Horas"
          valueSuffix="h"
          secondaryLabel="Promedio/ticket"
          secondarySuffix="h"
          emptyLabel="No hay horas estimadas para este rango de filtros."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <BreakdownList title="Por desarrollador" entries={summary.byDeveloper} />
        <BreakdownList title="Por Project Manager" entries={summary.byPm} />
      </div>
    </div>
  );
}
