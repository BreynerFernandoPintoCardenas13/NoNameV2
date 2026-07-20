import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FloatingPanelProps = React.ComponentProps<typeof Popover> & {
  trigger: React.ReactElement;
  className?: string;
  children: React.ReactNode;
};

/** Superficie glass elevada (sobre ui/popover.tsx) para paneles flotantes contextuales. */
export function FloatingPanel({ trigger, className, children, ...props }: FloatingPanelProps) {
  return (
    <Popover {...props}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className={cn("bg-popover/80 border-white/10 backdrop-blur-xl", className)}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
