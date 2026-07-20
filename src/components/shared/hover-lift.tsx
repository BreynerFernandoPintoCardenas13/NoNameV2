"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import { Slot, type WithAsChild } from "@/components/animate-ui/primitives/animate/slot";

type HoverLiftProps = WithAsChild<HTMLMotionProps<"div">>;

/**
 * Micro-elevación al hover, extraída de ProjectCard/NoteCard para no duplicar la
 * animación en cada superficie. Con `asChild` (animate-ui Slot) aplica el motion
 * directamente sobre el hijo, sin envolver en un div extra.
 */
export function HoverLift({ asChild = false, ...props }: HoverLiftProps) {
  const Component = asChild ? Slot : motion.div;

  return (
    <Component
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...props}
    />
  );
}
