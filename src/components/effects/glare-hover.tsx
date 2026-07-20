import * as React from "react";

import { cn } from "@/lib/utils";
import styles from "./glare-hover.module.css";

export type GlareHoverProps = Omit<React.ComponentProps<"div">, "style"> & {
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  transitionDuration?: number;
  style?: React.CSSProperties;
};

/**
 * GlareHover (React Bits) — reconstruido a partir del patrón conocido del componente
 * (no se compartió el código fuente exacto en esta integración): un barrido
 * diagonal, disparado por :hover en CSS puro, que cruza el contenido una vez.
 */
export function GlareHover({
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.2,
  glareAngle = -30,
  transitionDuration = 700,
  className,
  style,
  ...props
}: GlareHoverProps) {
  const vars = {
    "--glare-color": glareColor,
    "--glare-opacity": glareOpacity,
    "--glare-angle": `${glareAngle}deg`,
    "--glare-duration": `${transitionDuration}ms`,
  } as React.CSSProperties;

  return (
    <div className={cn(styles.glareHover, className)} style={{ ...vars, ...style }} {...props}>
      {children}
      <div className={styles.glareLayer} />
    </div>
  );
}
