"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { ChartTooltip } from "@/modules/admin/components/ChartTooltip";
import {
  CHART_AXIS_STROKE,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  colorAt,
} from "@/modules/admin/utils/chart-theme";
import { initials } from "@/modules/admin/utils/initials";

export interface DistributionDatum {
  id: string;
  name: string;
  value: number;
  secondaryValue?: number;
}

interface DistributionChartProps {
  data: DistributionDatum[];
  /** `horizontal` = barras que crecen a los lados (proyecto/tiempo); `columns` = barras verticales con avatar (PM). */
  orientation: "horizontal" | "columns";
  valueLabel: string;
  valueSuffix?: string;
  secondaryLabel?: string;
  secondarySuffix?: string;
  emptyLabel?: string;
}

function truncate(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function formatTooltipRow(
  valueLabel: string,
  valueSuffix: string,
  secondaryLabel: string | undefined,
  secondarySuffix: string,
  _name: unknown,
  value: unknown,
  payload: unknown,
): string {
  const p = payload as { percent: number; secondaryValue?: number };
  const parts = [`${valueLabel}: ${value}${valueSuffix}`, `${p.percent}%`];
  if (secondaryLabel && p.secondaryValue !== undefined) {
    parts.push(`${secondaryLabel}: ${p.secondaryValue}${secondarySuffix}`);
  }
  return parts.join(" · ");
}

function AvatarTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const name = payload?.value ?? "";
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cy={14} r={11} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" />
      <text
        x={0}
        y={18}
        textAnchor="middle"
        fontSize={9.5}
        fontWeight={600}
        fill="rgba(255,255,255,0.8)"
      >
        {initials(name)}
      </text>
      <text x={0} y={38} textAnchor="middle" fontSize={10.5} fill="rgba(255,255,255,0.5)">
        {truncate(name, 12)}
      </text>
    </g>
  );
}

/** BarChart real (Recharts) para distribuciones de una dimensión: tickets/horas por proyecto, PM o desarrollador. */
export function DistributionChart({
  data,
  orientation,
  valueLabel,
  valueSuffix = "",
  secondaryLabel,
  secondarySuffix = "",
  emptyLabel = "Sin datos para este rango de filtros.",
}: DistributionChartProps) {
  const total = React.useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const chartData = React.useMemo(
    () =>
      data.map((d) => ({
        ...d,
        percent: total > 0 ? Math.round((d.value / total) * 1000) / 10 : 0,
      })),
    [data, total],
  );

  if (chartData.length === 0) {
    return <EmptyState title="Sin datos" description={emptyLabel} />;
  }

  const height = orientation === "columns" ? 220 : Math.max(160, chartData.length * 34);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label={`Distribución de ${valueLabel.toLowerCase()} — ${chartData.length} grupos, ${total} en total`}
    >
      <ResponsiveContainer width="100%" height="100%">
        {orientation === "horizontal" ? (
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            accessibilityLayer
          >
            <CartesianGrid stroke={CHART_GRID_STROKE} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART_AXIS_STROKE}
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={CHART_AXIS_STROKE}
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={120}
              tickFormatter={(name: string) => truncate(name, 16)}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={(props) => (
                <ChartTooltip
                  {...props}
                  formatRow={(name, value, payload) =>
                    formatTooltipRow(
                      valueLabel,
                      valueSuffix,
                      secondaryLabel,
                      secondarySuffix,
                      name,
                      value,
                      payload,
                    )
                  }
                />
              )}
            />
            <Bar dataKey="value" name={valueLabel} radius={[0, 4, 4, 0]} maxBarSize={22}>
              {chartData.map((entry, index) => (
                <Cell key={entry.id} fill={colorAt(index)} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
            accessibilityLayer
          >
            <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={CHART_AXIS_STROKE}
              tick={<AvatarTick />}
              tickLine={false}
              axisLine={false}
              height={44}
              interval={0}
            />
            <YAxis
              stroke={CHART_AXIS_STROKE}
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={(props) => (
                <ChartTooltip
                  {...props}
                  formatRow={(name, value, payload) =>
                    formatTooltipRow(
                      valueLabel,
                      valueSuffix,
                      secondaryLabel,
                      secondarySuffix,
                      name,
                      value,
                      payload,
                    )
                  }
                />
              )}
            />
            <Bar dataKey="value" name={valueLabel} radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={entry.id} fill={colorAt(index)} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}
