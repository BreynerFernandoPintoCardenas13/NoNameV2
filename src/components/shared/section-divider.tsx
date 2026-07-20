import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SectionDividerProps = React.ComponentProps<"div"> & {
  label?: string;
};

export function SectionDivider({ label, className, ...props }: SectionDividerProps) {
  if (!label) {
    return <Separator className={className} {...props} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <Separator className="flex-1" />
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
