import type { TimeBreakdownEntry, TimeSummary } from "@/modules/admin/types";

function BreakdownBlock({ title, entries }: { title: string; entries: TimeBreakdownEntry[] }) {
  return (
    <div>
      <p className="mb-2 text-[12.5px] font-medium text-white/70">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={entry.groupId} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="truncate text-white/70">{entry.groupName}</span>
            <span className="shrink-0 text-white/45">{entry.estimatedHours} h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horas por proyecto/desarrollador/PM + promedios. Puramente presentacional. */
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <BreakdownBlock title="Por proyecto" entries={summary.byProject} />
        <BreakdownBlock title="Por desarrollador" entries={summary.byDeveloper} />
        <BreakdownBlock title="Por Project Manager" entries={summary.byPm} />
      </div>
    </div>
  );
}
