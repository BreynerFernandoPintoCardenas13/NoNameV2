"use client";

import * as React from "react";

import {
  Checkbox as CheckboxPrimitive,
  CheckboxIndicator,
  type CheckboxProps as CheckboxPrimitiveProps,
} from "@/components/animate-ui/primitives/radix/checkbox";
import { cn } from "@/lib/utils";

type AnimatedCheckboxProps = Omit<CheckboxPrimitiveProps, "checked"> & {
  checked?: boolean | "indeterminate";
};

/**
 * Checkbox con trazo de check/indeterminate dibujado (path animation), distinto del
 * checkbox base de formularios (ui/checkbox.tsx, sobre base-ui). Pensado para listas
 * de opciones standalone — configuración, preferencias — no para <FormField>.
 */
export function AnimatedCheckbox({ className, ...props }: AnimatedCheckboxProps) {
  return (
    <CheckboxPrimitive
      className={cn(
        "border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary focus-visible:ring-ring/50 flex size-4 items-center justify-center rounded-[4px] border transition-colors outline-none focus-visible:ring-3",
        className,
      )}
      {...props}
    >
      <CheckboxIndicator className="text-primary-foreground size-3.5" />
    </CheckboxPrimitive>
  );
}
