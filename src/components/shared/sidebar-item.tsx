"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import { Slot, type WithAsChild } from "@/components/animate-ui/primitives/animate/slot";
import { cn } from "@/lib/utils";

type SidebarItemProps = WithAsChild<HTMLMotionProps<"button">> & {
  icon?: React.ReactNode;
  active?: boolean;
};

const baseClasses =
  "text-muted-foreground hover:text-foreground relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors";

/**
 * Ítem de navegación con indicador de selección animado (layoutId compartido entre ítems).
 * Con `asChild` (animate-ui Slot) se convierte en <Link> u otro elemento interactivo
 * sin duplicar estilos: útil para cuando el sidebar tenga navegación real.
 */
export function SidebarItem({
  icon,
  active,
  asChild = false,
  className,
  children,
  ...props
}: SidebarItemProps) {
  if (asChild) {
    return (
      <Slot
        data-active={active}
        className={cn(
          baseClasses,
          "data-[active=true]:bg-muted data-[active=true]:text-foreground",
          className,
        )}
        {...props}
      >
        {children as React.ReactElement}
      </Slot>
    );
  }

  return (
    <motion.button
      type="button"
      data-active={active}
      className={cn(baseClasses, active && "text-foreground", className)}
      {...props}
    >
      {active && (
        <motion.span
          layoutId="sidebar-item-active"
          className="bg-muted absolute inset-0 -z-10 rounded-lg"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative flex items-center gap-2.5">
        {icon}
        {children as React.ReactNode}
      </span>
    </motion.button>
  );
}
