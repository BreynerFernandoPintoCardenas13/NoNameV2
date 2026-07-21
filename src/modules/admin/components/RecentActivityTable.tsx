import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassBadge } from "@/components/shared/glass-badge";
import type { ActivityItem } from "@/modules/admin/types";
import { initials } from "@/modules/admin/utils/initials";
import { formatRelativeTime } from "@/modules/admin/utils/relative-time";

/**
 * Tickets actualizados recientemente — no es un log de auditoría real (ver
 * ADMIN_ANALYTICS_PLAN.md §8, riesgo 5: `activities` no ofrece un feed
 * global en OpenProject). `ActivityItem` no trae status/tipo de ticket (esa
 * información no forma parte del contrato de Fase 4) — la tabla muestra lo
 * que sí es dato real: ticket, proyecto, responsable, PM y fecha relativa.
 */
export function RecentActivityTable({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin actividad reciente"
        description="No hay tickets actualizados para este rango de filtros."
      />
    );
  }

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
              <td className="max-w-[240px] py-2.5">
                <div className="flex items-center gap-2">
                  <GlassBadge className="shrink-0">#{item.ticketId}</GlassBadge>
                  <span className="truncate text-[#f7f7f7]">{item.ticketSubject}</span>
                </div>
              </td>
              <td className="py-2.5 text-white/60">{item.projectName}</td>
              <td className="py-2.5">
                {item.responsibleName ? (
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-white/10 text-[10.5px] text-white/70">
                        {initials(item.responsibleName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white/70">{item.responsibleName}</span>
                  </div>
                ) : (
                  <span className="text-white/35">—</span>
                )}
              </td>
              <td className="py-2.5 text-white/60">{item.pmName ?? "—"}</td>
              <td
                className="py-2.5 whitespace-nowrap text-white/45"
                title={new Date(item.updatedAt).toLocaleString("es-CO")}
              >
                {formatRelativeTime(item.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
