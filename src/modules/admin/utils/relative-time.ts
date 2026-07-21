const UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 604800, divisor: 86400, unit: "day" },
  { limit: 2629800, divisor: 604800, unit: "week" },
  { limit: 31557600, divisor: 2629800, unit: "month" },
  { limit: Infinity, divisor: 31557600, unit: "year" },
];

const formatter = new Intl.RelativeTimeFormat("es-CO", { numeric: "auto" });

/** "Hace 2 horas" / "Hace 3 días" — nunca fechas crudas en la tabla de actividad reciente. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffSeconds = (new Date(iso).getTime() - now.getTime()) / 1000;
  const absSeconds = Math.abs(diffSeconds);
  const { divisor, unit } = UNITS.find((u) => absSeconds < u.limit) ?? UNITS[UNITS.length - 1];
  return formatter.format(Math.round(diffSeconds / divisor), unit);
}
