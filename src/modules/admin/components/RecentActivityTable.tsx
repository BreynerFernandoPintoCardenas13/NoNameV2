import type { ActivityItem } from "@/modules/admin/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Tickets actualizados recientemente — no es un log de auditoría real (ver
 * ADMIN_ANALYTICS_PLAN.md §8, riesgo 5: `activities` no ofrece un feed
 * global en OpenProject).
 */
export function RecentActivityTable({ items }: { items: ActivityItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] tracking-wide text-white/40 uppercase">
            <th className="pb-2 font-medium">Ticket</th>
            <th className="pb-2 font-medium">Proyecto</th>
            <th className="pb-2 font-medium">Responsable</th>
            <th className="pb-2 font-medium">PM</th>
            <th className="pb-2 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-white/[0.06]">
              <td className="max-w-[220px] py-2.5 text-[#f7f7f7]">
                <span className="text-white/40">#{item.ticketId}</span> {item.ticketSubject}
              </td>
              <td className="py-2.5 text-white/60">{item.projectName}</td>
              <td className="py-2.5 text-white/60">{item.responsibleName ?? "—"}</td>
              <td className="py-2.5 text-white/60">{item.pmName ?? "—"}</td>
              <td className="py-2.5 whitespace-nowrap text-white/45">
                {dateFormatter.format(new Date(item.updatedAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
