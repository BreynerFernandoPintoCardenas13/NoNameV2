"use client";

import * as React from "react";
import type { HTMLMotionProps } from "motion/react";

import { Slot } from "@/components/animate-ui/primitives/animate/slot";
import { Button } from "@/components/ui/button";

type AnimatedButtonProps = React.ComponentProps<typeof Button> &
  Pick<HTMLMotionProps<"button">, "whileHover" | "whileTap">;

/** Botón con micro-motion de hover/press aplicado vía animate-ui Slot (sin div wrapper). */
export function AnimatedButton({
  whileHover = { y: -1 },
  whileTap = { scale: 0.96 },
  ...props
}: AnimatedButtonProps) {
  return (
    <Slot
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <Button {...props} />
    </Slot>
  );
}
