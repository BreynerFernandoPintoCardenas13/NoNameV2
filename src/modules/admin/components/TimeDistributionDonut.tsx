"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { ChartTooltip } from "@/modules/admin/components/ChartTooltip";
import type { TimeBreakdownEntry } from "@/modules/admin/types";
import { colorAt } from "@/modules/admin/utils/chart-theme";

/** Distribución de horas por proyecto — DonutChart (Recharts) + leyenda con horas/% (también sirve de fallback textual). */
export function TimeDistributionDonut({ entries }: { entries: TimeBreakdownEntry[] }) {
  const total = React.useMemo(
    () => entries.reduce((sum, e) => sum + e.estimatedHours, 0),
    [entries],
  );
  const data = React.useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.groupId,
        name: entry.groupName,
        hours: entry.estimatedHours,
        percent: total > 0 ? Math.round((entry.estimatedHours / total) * 1000) / 10 : 0,
      })),
    [entries, total],
  );

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sin horas registradas"
        description="No hay horas estimadas para este rango de filtros."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="h-52 w-52 shrink-0"
        role="img"
        aria-label={`Distribución de horas por proyecto — ${total.toFixed(1)} horas en total`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="hours"
              nameKey="name"
              innerRadius="60%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive
            >
              {data.map((entry, index) => (
                <Cell key={entry.id} fill={colorAt(index)} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  formatRow={(name, _value, payload) => {
                    const p = payload as { hours: number; percent: number };
                    return `${name}: ${p.hours}h · ${p.percent}%`;
                  }}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 self-stretch">
        {data.map((entry, index) => (
          <li key={entry.id} className="flex items-center gap-2 text-[13px]">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorAt(index) }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-white/70">{entry.name}</span>
            <span className="shrink-0 text-white/45">{entry.hours}h</span>
            <span className="w-11 shrink-0 text-right text-white/35">{entry.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
