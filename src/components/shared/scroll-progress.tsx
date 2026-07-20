"use client";

import * as React from "react";

import {
  ScrollProgress,
  ScrollProgressContainer,
  ScrollProgressProvider,
} from "@/components/animate-ui/primitives/animate/scroll-progress";
import { cn } from "@/lib/utils";

type ScrollProgressBarProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Eje que se sigue: vertical (por defecto) u horizontal. */
  direction?: "vertical" | "horizontal";
};

/**
 * Barra de progreso de scroll (1px, discreta) para cualquier contenido largo, en
 * modo "local" (esta instancia = un contenedor scrollable propio). Base del editor
 * de notas; reutilizable en documentación, vistas largas, configuraciones y paneles.
 */
export function ScrollProgressBar({
  children,
  className,
  containerClassName,
  direction = "vertical",
}: ScrollProgressBarProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <ScrollProgressProvider direction={direction}>
      <div className={cn("relative flex min-h-0 flex-1", isHorizontal ? "flex-row" : "flex-col")}>
        <div
          className={cn(
            "bg-border/60 relative z-10 shrink-0 overflow-hidden",
            isHorizontal ? "h-full w-px" : "h-px w-full",
          )}
        >
          <ScrollProgress
            mode={isHorizontal ? "height" : "width"}
            className={cn("bg-foreground", isHorizontal ? "w-px" : "h-px", className)}
          />
        </div>
        <ScrollProgressContainer
          className={cn(
            "min-h-0 flex-1",
            isHorizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto",
            containerClassName,
          )}
        >
          {children}
        </ScrollProgressContainer>
      </div>
    </ScrollProgressProvider>
  );
}
