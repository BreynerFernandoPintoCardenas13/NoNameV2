"use client";

import * as React from "react";

import { GlareHover } from "@/components/effects/glare-hover";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export type HeroCardProps = {
  label: string;
  onHoverChange?: (hovered: boolean) => void;
  className?: string;
};

/** Mini tarjeta glass del Hero — texto estático; el hover actualiza el titular del Hero (ver Hero.tsx) y agranda la tarjeta. */
export function HeroCard({ label, onHoverChange, className }: HeroCardProps) {
  return (
    <GlareHover
      glareOpacity={0.15}
      transitionDuration={900}
      className={cn(
        "relative flex h-[94px] min-w-[112px] shrink-0 items-center rounded-[20px] bg-white/[0.16] p-3 backdrop-blur-xl transition-transform duration-500 ease-out hover:z-10 hover:scale-110",
        className,
      )}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <span className={cn(playfair.className, "text-[11px] tracking-[0.02em] text-white/85")}>
        {label}
      </span>
    </GlareHover>
  );
}
