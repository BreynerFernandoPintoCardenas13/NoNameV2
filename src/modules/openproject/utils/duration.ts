/** Convierte horas (puede tener decimales) al formato de duración ISO 8601 que espera OpenProject. */
export function hoursToIso8601Duration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0 && minutes === 0) {
    return "PT0H";
  }

  let duration = "PT";
  if (wholeHours > 0) duration += `${wholeHours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  return duration;
}
