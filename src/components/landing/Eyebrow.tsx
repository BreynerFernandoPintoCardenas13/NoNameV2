import * as React from "react";

import { ShinyText } from "@/components/effects/shiny-text";
import { cn } from "@/lib/utils";

export type EyebrowProps = {
  children: string;
  className?: string;
};

/** Etiqueta pequeña en mayúsculas con brillo sutil (ShinyText) — nunca para títulos grandes. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <ShinyText
      text={children}
      speed={5}
      className={cn("text-[13px] tracking-[0.06em] text-white/55", className)}
    />
  );
}
