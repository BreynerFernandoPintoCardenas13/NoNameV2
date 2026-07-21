import { LineChart } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TicketTrend } from "@/modules/admin/types";

/**
 * Resumen numérico + placeholder elegante de la gráfica de tendencia. La
 * gráfica interactiva (Recharts) llega en la siguiente fase — este
 * componente ya usa datos reales (mock) para los números, no para el trazo.
 */
export function TrendChart({ trend }: { trend: TicketTrend }) {
  const positive = trend.changePercent >= 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-[#f7f7f7]">
            {trend.totalCurrentPeriod}
          </p>
          <p className="text-[12.5px] text-white/45">tickets en el período</p>
        </div>
        <p className={cn("text-sm", positive ? "text-emerald-400" : "text-red-400")}>
          {positive ? "+" : ""}
          {trend.changePercent.toFixed(1)}% vs. período anterior ({trend.totalPreviousPeriod})
        </p>
      </div>

      <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
        <LineChart className="size-6 text-white/25" aria-hidden="true" />
        <p className="text-[11.5px] text-white/30">
          Gráfica interactiva disponible en la siguiente fase
        </p>
      </div>
    </div>
  );
}
