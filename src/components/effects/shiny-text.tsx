import * as React from "react";

import { cn } from "@/lib/utils";
import styles from "./shiny-text.module.css";

export type ShinyTextProps = {
  text: string;
  disabled?: boolean;
  /** Duración de un barrido completo, en segundos. */
  speed?: number;
  className?: string;
};

/**
 * ShinyText (React Bits) — reconstruido a partir del patrón conocido del componente
 * (no se compartió el código fuente exacto en esta integración). Texto base real y
 * legible + una capa decorativa aria-hidden con el barrido de brillo, para nunca
 * depender de background-clip para la legibilidad.
 */
export function ShinyText({ text, disabled = false, speed = 4, className }: ShinyTextProps) {
  return (
    <span className={cn(styles.wrapper, className)}>
      <span>{text}</span>
      {!disabled && (
        <span
          aria-hidden="true"
          className={styles.overlay}
          style={{ animationDuration: `${speed}s` }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
