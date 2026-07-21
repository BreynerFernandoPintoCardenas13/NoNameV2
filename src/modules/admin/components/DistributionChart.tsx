import { PieChart } from "lucide-react";

import type { TicketDistribution } from "@/modules/admin/types";

/** Placeholder elegante para la gráfica de distribución (PM/Proyecto) — la tabla de abajo ya tiene datos reales. */
export function DistributionChart({ distribution }: { distribution: TicketDistribution[] }) {
  const total = distribution.reduce((sum, entry) => sum + entry.ticketCount, 0);

  return (
    <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
      <PieChart className="size-6 text-white/25" aria-hidden="true" />
      <p className="text-[12.5px] text-white/50">
        {total} tickets en {distribution.length} grupos
      </p>
      <p className="text-[11.5px] text-white/30">
        Gráfica interactiva disponible en la siguiente fase
      </p>
    </div>
  );
}
