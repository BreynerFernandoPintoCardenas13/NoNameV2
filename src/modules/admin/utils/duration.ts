export { hoursToIso8601Duration } from "@/modules/openproject/utils/duration";

/**
 * Parsea una duración ISO 8601 (ej. `"PT5H30M"`, tal como la devuelve
 * `time_entries.hours`) a horas decimales. Inverso de
 * `hoursToIso8601Duration` — esa ya existía en `modules/openproject/utils`,
 * así que se reexporta aquí en vez de duplicarla.
 */
export function iso8601DurationToHours(duration: string): number {
  const match = /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?$/.exec(duration);
  if (!match) return 0;
  const hours = match[1] ? Number.parseFloat(match[1]) : 0;
  const minutes = match[2] ? Number.parseFloat(match[2]) : 0;
  return hours + minutes / 60;
}
