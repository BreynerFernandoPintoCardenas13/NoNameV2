"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "@/modules/admin/components/ChartTooltip";
import type { TicketTrend, TrendPoint } from "@/modules/admin/types";
import {
  CHART_AXIS_STROKE,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
} from "@/modules/admin/utils/chart-theme";

interface TrendChartProps {
  trend: TicketTrend;
  /**
   * Serie del período anterior, alineada por índice con `trend.points`. El
   * backend hoy solo entrega el total agregado (`totalPreviousPeriod`, ya
   * mostrado como texto arriba), no la serie punto a punto — este prop deja
   * el componente listo para esa comparación sin inventar datos mientras
   * tanto (línea tenue punteada, solo se dibuja si llega).
   */
  previousPoints?: TrendPoint[];
}

/** Tendencia de tickets — LineChart real (Recharts) con línea suavizada, tooltip y puntos. */
export function TrendChart({ trend, previousPoints }: TrendChartProps) {
  const positive = trend.changePercent >= 0;

  const data = React.useMemo(
    () =>
      trend.points.map((point, index) => ({
        label: point.bucketLabel,
        current: point.count,
        previous: previousPoints?.[index]?.count,
      })),
    [trend.points, previousPoints],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-[#f7f7f7]">
            {trend.totalCurrentPeriod}
          </p>
          <p className="text-[12.5px] text-white/45">tickets en el período</p>
        </div>
        <p
          className={cn(
            "flex items-center gap-1 text-sm",
            positive ? "text-success" : "text-destructive",
          )}
        >
          {positive ? (
            <TrendingUp className="size-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="size-3.5" aria-hidden="true" />
          )}
          {positive ? "+" : ""}
          {trend.changePercent.toFixed(1)}% vs. período anterior ({trend.totalPreviousPeriod})
        </p>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Sin tickets en este rango"
          description="Ajusta los filtros de fecha para ver la tendencia."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-56 w-full"
          role="img"
          aria-label={`Tendencia de tickets: ${trend.totalCurrentPeriod} en el período actual, ${positive ? "+" : ""}${trend.changePercent.toFixed(1)}% vs. el período anterior`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={CHART_AXIS_STROKE}
                tick={CHART_AXIS_TICK}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
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
                cursor={{ stroke: CHART_GRID_STROKE, strokeWidth: 1 }}
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    formatRow={(name, value) =>
                      `${name === "current" ? "Tickets" : "Período anterior"}: ${value}`
                    }
                  />
                )}
              />
              {previousPoints && (
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="previous"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  opacity={0.6}
                  isAnimationActive={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="current"
                name="current"
                stroke="var(--chart-2)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--chart-2)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
