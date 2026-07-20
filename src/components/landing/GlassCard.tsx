import * as React from "react";

import { cn } from "@/lib/utils";

export type GlassCardProps = React.ComponentProps<"div">;

/** Panel translúcido con blur — usado por el marco del Hero y la tarjeta de contacto. */
export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.16] bg-white/[0.055] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
