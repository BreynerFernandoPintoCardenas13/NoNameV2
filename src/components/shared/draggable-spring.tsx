"use client";

import * as React from "react";

import {
  Spring,
  SpringElement,
  SpringProvider,
} from "@/components/animate-ui/primitives/animate/spring";
import { cn } from "@/lib/utils";

type DraggableSpringProps = {
  children: React.ReactElement;
  /** Muestra el hilo elástico (SVG) que conecta el punto de origen con el elemento. */
  showCord?: boolean;
  className?: string;
};

/**
 * Física de arrastre con retorno elástico (drag + snap-back), sobre animate-ui Spring.
 * Úsalo con moderación: avatar, previews de imagen, tarjetas/acciones flotantes.
 */
export function DraggableSpring({ children, showCord = false, className }: DraggableSpringProps) {
  return (
    <SpringProvider>
      {showCord && <Spring className="text-foreground/15" />}
      <SpringElement className={cn("touch-none", className)}>{children}</SpringElement>
    </SpringProvider>
  );
}
