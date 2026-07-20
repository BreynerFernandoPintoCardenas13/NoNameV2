"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";

export type ScrollRevealSectionProps = Omit<HTMLMotionProps<"section">, "ref"> & {
  children: React.ReactNode;
};

/**
 * Revela una sección a medida que entra en viewport: opacidad + blur + translateY
 * ligados al scroll (useScroll/useTransform), migrado del listener manual del
 * diseño original a Framer Motion — mismo timing, sin recalcular en cada frame a mano.
 */
export function ScrollRevealSection({ children, className, ...props }: ScrollRevealSectionProps) {
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.3"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [26, 0]);
  const blur = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.section ref={ref} style={{ opacity, y, filter }} className={className} {...props}>
      {children}
    </motion.section>
  );
}
