"use client";

import * as React from "react";

/**
 * Paginación client-side sobre un array ya cargado por completo (ej.
 * `TimeSummary.byProject`, que puede traer muchas más filas de las que
 * conviene renderizar de una vez) — "Ver más" revela `step` elementos
 * adicionales sin volver a pedirle nada al servidor.
 */
export function useShowMore<T>(items: T[], initialCount = 10, step = 10) {
  const [visibleCount, setVisibleCount] = React.useState(initialCount);

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const showMore = React.useCallback(() => setVisibleCount((count) => count + step), [step]);

  return { visible, hasMore, showMore, remaining: items.length - visible.length };
}
