import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatCardData } from "@/modules/admin/types";

/** Una card de "Dashboard General": número grande + flecha de tendencia opcional. Puramente presentacional. */
export function StatCard({ stat }: { stat: StatCardData }) {
  const trend = stat.changePercent;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[12.5px] text-white/50">{stat.label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-[#f7f7f7]">
          {stat.value.toLocaleString("es-CO")}
        </span>
        {stat.unit && <span className="text-sm text-white/40">{stat.unit}</span>}
      </div>
      {trend != null && (
        <p
          className={cn(
            "mt-1.5 flex items-center gap-1 text-xs",
            trend >= 0 ? "text-emerald-400" : "text-red-400",
          )}
        >
          {trend >= 0 ? (
            <TrendingUp className="size-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="size-3.5" aria-hidden="true" />
          )}
          {Math.abs(trend).toFixed(1)}% vs. período anterior
        </p>
      )}
      {stat.caveat && <p className="mt-1.5 text-[11px] text-white/35">{stat.caveat}</p>}
    </div>
  );
}
