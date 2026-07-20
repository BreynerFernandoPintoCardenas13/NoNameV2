import * as React from "react";

import { cn } from "@/lib/utils";

type SidebarGroupProps = React.ComponentProps<"div"> & {
  label?: string;
};

export function SidebarGroup({ label, className, children, ...props }: SidebarGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {label && (
        <p className="text-muted-foreground px-3 text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
