/**
 * Paleta y helpers compartidos por los charts de Recharts del panel — únicamente
 * las variables CSS ya definidas en `globals.css` (ver ADMIN_ANALYTICS_PLAN.md
 * §15.3), nunca colores nuevos hardcodeados. Recharts acepta `var(--token)`
 * directamente como color SVG.
 */
export const CHART_COLORS = [
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-1)",
] as const;

export const CHART_GRID_STROKE = "rgba(255,255,255,0.08)";
export const CHART_AXIS_STROKE = "rgba(255,255,255,0.4)";
export const CHART_AXIS_TICK = { fill: "rgba(255,255,255,0.45)", fontSize: 11.5 };

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
