/** "Laura Gómez" → "LG" — usado por cualquier avatar-fallback del panel (evita duplicar la regla). */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
