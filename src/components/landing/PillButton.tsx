import * as React from "react";

import { cn } from "@/lib/utils";

export type PillButtonProps = React.ComponentProps<"button"> & {
  variant?: "solid" | "glass";
};

const VARIANT_CLASSES: Record<NonNullable<PillButtonProps["variant"]>, string> = {
  solid: "bg-white text-neutral-950 hover:opacity-[0.82] hover:-translate-y-px",
  glass:
    "bg-white/[0.14] border border-white/[0.32] backdrop-blur-md text-[#f7f7f7] hover:bg-white/[0.24] hover:-translate-y-0.5",
};

/** Botón real (nunca un <a href="#">) para las acciones de la landing sin backend todavía. */
export function PillButton({ variant = "solid", className, ...props }: PillButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-fit items-center rounded-full text-sm font-medium tracking-[0.01em] transition-all duration-300 ease-out",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
