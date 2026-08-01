"use client";

import { animate, useInView } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type StatCounterProps = {
  /** Valor final a mostrar (solo la parte numérica). */
  value: number;
  /** Texto antes del número, ej. "≈ $" */
  prefix?: string;
  /** Texto después del número, ej. "%" o " horas". */
  suffix?: string;
  /** Decimales a mostrar. */
  decimals?: number;
  /** Separador de miles del locale a usar. */
  locale?: string;
  duration?: number;
  className?: string;
};

/**
 * Número grande que cuenta de 0 al valor final una sola vez, al entrar en
 * viewport. Un único punto para todas las cifras animadas de /detalles —
 * evita reimplementar el mismo useInView+animate en cada sección.
 */
export function StatCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "es-CO",
  duration = 1.4,
  className,
}: StatCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
