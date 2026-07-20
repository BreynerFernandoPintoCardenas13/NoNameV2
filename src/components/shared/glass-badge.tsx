import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GlassBadgeProps = React.ComponentProps<typeof Badge>;

/** Variante translúcida de ui/badge.tsx para superponer sobre cards/imágenes. */
export function GlassBadge({ className, ...props }: GlassBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-foreground border-white/10 bg-white/5 backdrop-blur-md", className)}
      {...props}
    />
  );
}
