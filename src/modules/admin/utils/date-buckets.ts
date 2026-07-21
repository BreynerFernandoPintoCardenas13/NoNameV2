import type { TrendGranularity, TrendPoint } from "@/modules/admin/types";

/**
 * Bucketing temporal y comparación de períodos — funciones puras, sin
 * llamadas de red. `groupBy` de OpenProject no agrupa por fecha (ver
 * ADMIN_ANALYTICS_PLAN.md §12), así que esto es lo que reemplaza esa
 * capacidad ausente: agrupamos las filas crudas nosotros mismos.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day; // semana empieza en lunes
  start.setDate(start.getDate() + diff);
  return start;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const DAY_LABEL = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" });
const MONTH_LABEL = new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric" });

/** Fechas de creación (o similar) agrupadas por día, un punto por cada día con al menos un registro. */
export function bucketByDay(dates: Date[]): TrendPoint[] {
  return bucket(
    dates,
    startOfDay,
    (d) => d.toISOString().slice(0, 10),
    (d) => DAY_LABEL.format(d),
  );
}

/** Igual, agrupando por semana (lunes como inicio de semana). */
export function bucketByWeek(dates: Date[]): TrendPoint[] {
  return bucket(
    dates,
    startOfWeek,
    (d) => d.toISOString().slice(0, 10),
    (d) => `Sem. ${DAY_LABEL.format(d)}`,
  );
}

/** Igual, agrupando por mes calendario. */
export function bucketByMonth(dates: Date[]): TrendPoint[] {
  return bucket(
    dates,
    startOfMonth,
    (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    (d) => MONTH_LABEL.format(d),
  );
}

function bucket(
  dates: Date[],
  bucketStart: (date: Date) => Date,
  keyOf: (date: Date) => string,
  labelOf: (date: Date) => string,
): TrendPoint[] {
  const counts = new Map<string, { start: Date; count: number }>();
  for (const date of dates) {
    const start = bucketStart(date);
    const key = keyOf(start);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { start, count: 1 });
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => a.start.getTime() - b.start.getTime())
    .map(([key, { start, count }]) => ({ bucketKey: key, bucketLabel: labelOf(start), count }));
}

/** Aplica la granularidad pedida sobre una lista de fechas crudas. */
export function bucketByGranularity(dates: Date[], granularity: TrendGranularity): TrendPoint[] {
  if (granularity === "day") return bucketByDay(dates);
  if (granularity === "week") return bucketByWeek(dates);
  return bucketByMonth(dates);
}

/** Variación porcentual de `current` contra `previous`. `null` si `previous` es 0 (división indefinida). */
export function calculateVariation(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Rango del período anterior, de la misma duración que [from, to], inmediatamente antes de `from`. */
export function previousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const durationMs = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - DAY_MS);
  const previousFrom = new Date(previousTo.getTime() - durationMs);
  return { from: previousFrom, to: previousTo };
}
