import * as React from "react";

import { Eyebrow } from "@/components/landing/Eyebrow";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export type SectionHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

/** Bloque eyebrow + título + descripción corta, repetido en cada sección de /detalles. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          playfair.className,
          "mt-4 max-w-3xl text-[clamp(26px,3.4vw,44px)] leading-[1.12] font-semibold tracking-[-0.01em] text-[#f7f7f7]",
          align === "center" && "mx-auto",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-xl text-[15px] leading-[1.7] text-white/65",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
