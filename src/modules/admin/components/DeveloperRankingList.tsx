"use client";

import { motion } from "motion/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import type { DeveloperRankingItem } from "@/modules/admin/types";
import { colorAt } from "@/modules/admin/utils/chart-theme";
import { initials } from "@/modules/admin/utils/initials";

const MEDALS = ["🥇", "🥈", "🥉"];

/** Ranking visual de desarrolladores: posición/medalla, avatar, barra de progreso (carga) y métricas. */
export function DeveloperRankingList({ items }: { items: DeveloperRankingItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin desarrolladores"
        description="No hay tickets asignados para este rango de filtros."
      />
    );
  }

  const max = Math.max(...items.map((item) => item.workload), 1);

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
        >
          <span
            className="w-6 shrink-0 text-center text-[13px] font-medium text-white/40"
            aria-label={`Posición ${index + 1}`}
          >
            {MEDALS[index] ?? `#${index + 1}`}
          </span>
          <Avatar size="sm">
            <AvatarFallback className="bg-white/10 text-[11px] text-white/75">
              {initials(item.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="truncate text-[13.5px] text-[#f7f7f7]">{item.name}</span>
              <span className="shrink-0 text-[12px] text-white/50">
                {item.ticketCount} tickets · {item.estimatedHours}h
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colorAt(index) }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.workload / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.04 }}
              />
            </div>
            <p className="mt-0.5 text-[11px] text-white/35">
              {item.projectCount} proyectos · carga {item.workload}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
