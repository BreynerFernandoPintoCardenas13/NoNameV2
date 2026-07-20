"use client";

import * as React from "react";

import {
  MotionGrid,
  MotionGridCells,
  type Frames,
} from "@/components/animate-ui/primitives/animate/motion-grid";
import { cn } from "@/lib/utils";

function diagonalSweepFrames(cols: number, rows: number): Frames {
  const frames: Frames = [];
  for (let k = 0; k < cols + rows - 1; k++) {
    const frame: Frames[number] = [];
    for (let y = 0; y < rows; y++) {
      const x = k - y;
      if (x >= 0 && x < cols) frame.push([x, y]);
    }
    frames.push(frame);
  }
  return frames;
}

const GRID_SIZE = {
  xs: [3, 3],
  sm: [4, 4],
  md: [5, 5],
  lg: [6, 6],
} as const satisfies Record<string, [number, number]>;

const BOX_SIZE = {
  xs: "size-4",
  sm: "size-8",
  md: "size-12",
  lg: "size-16",
} as const satisfies Record<keyof typeof GRID_SIZE, string>;

type AnimatedLoaderProps = {
  size?: keyof typeof GRID_SIZE;
  label?: string;
  className?: string;
};

/** Reemplazo de spinner tradicional para estados de carga (crear ticket, IA pensando, guardar, sincronizar). */
export function AnimatedLoader({ size = "md", label, className }: AnimatedLoaderProps) {
  const [cols, rows] = GRID_SIZE[size];
  const frames = React.useMemo(() => diagonalSweepFrames(cols, rows), [cols, rows]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex flex-col items-center gap-2", className)}
    >
      <MotionGrid
        gridSize={[cols, rows]}
        frames={frames}
        duration={90}
        className={cn("gap-0.5", BOX_SIZE[size])}
      >
        <MotionGridCells
          className="bg-foreground/10 rounded-[2px]"
          activeProps={{ className: "bg-foreground" }}
        />
      </MotionGrid>
      {label && <span className="text-muted-foreground text-xs">{label}</span>}
    </div>
  );
}
