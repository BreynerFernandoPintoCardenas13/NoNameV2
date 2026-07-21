export { hoursToIso8601Duration } from "@/modules/openproject/utils/duration";

/**
 * Parsea una duración ISO 8601 (ej. `"PT5H30M"`, tal como la devuelve
 * `time_entries.hours`, o `"P1DT5H12M"`/`"P222DT13H24M25S"`, tal como
 * devuelven `sums`/`totalSums` de `work_packages` cuando suman más de un
 * día — verificado en vivo contra la instancia real) a horas decimales.
 * Inverso de `hoursToIso8601Duration` — esa ya existía en
 * `modules/openproject/utils`, así que se reexporta aquí en vez de duplicarla.
 */
const DURATION_PATTERN =
  /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

export function iso8601DurationToHours(duration: string | null | undefined): number {
  if (!duration) return 0;
  const match = DURATION_PATTERN.exec(duration);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match;
  return (
    (days ? Number.parseFloat(days) * 24 : 0) +
    (hours ? Number.parseFloat(hours) : 0) +
    (minutes ? Number.parseFloat(minutes) / 60 : 0) +
    (seconds ? Number.parseFloat(seconds) / 3600 : 0)
  );
}
