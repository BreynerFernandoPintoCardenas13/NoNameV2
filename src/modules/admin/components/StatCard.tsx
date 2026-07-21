import {
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  Clock,
  FolderKanban,
  type LucideIcon,
  TrendingDown,
  TrendingUp,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { StatCardData } from "@/modules/admin/types";
import { colorAt } from "@/modules/admin/utils/chart-theme";

const ICON_BY_STAT_ID: Record<string, LucideIcon> = {
  "tickets-today": CalendarCheck2,
  "tickets-week": CalendarRange,
  "tickets-month": CalendarDays,
  "estimated-hours-month": Clock,
  "active-projects": FolderKanban,
  "active-pms": UserCog,
  "active-users": Users,
  "meetings-processed": Video,
};

/** Card de "Dashboard General": icono, valor, tendencia y color según comportamiento — estilo SaaS moderno. */
export function StatCard({ stat, index = 0 }: { stat: StatCardData; index?: number }) {
  const trend = stat.changePercent;
  const Icon = ICON_BY_STAT_ID[stat.id] ?? FolderKanban;
  const accentColor =
    trend == null ? colorAt(index) : trend >= 0 ? "var(--success)" : "var(--destructive)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] text-white/50">{stat.label}</p>
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: accentColor }}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </div>
      </div>

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
            trend >= 0 ? "text-success" : "text-destructive",
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
    </motion.div>
  );
}
