"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";

import {
  DropdownMenu as DropdownMenuPrimitive,
  DropdownMenuContent as DropdownMenuContentPrimitive,
  DropdownMenuGroup,
  DropdownMenuHighlight,
  DropdownMenuHighlightItem,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuLabel as DropdownMenuLabelPrimitive,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuShortcut as DropdownMenuShortcutPrimitive,
  DropdownMenuSub,
  DropdownMenuSubContent as DropdownMenuSubContentPrimitive,
  DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive,
  DropdownMenuTrigger,
} from "@/components/animate-ui/primitives/radix/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Dropdown Menu canónico del proyecto (Radix + animate-ui, con highlight deslizante y
 * soporte de submenús). Reemplaza a ui/dropdown-menu.tsx (base-ui, sin highlight) para
 * cualquier menú nuevo — misma forma de API, así que es un reemplazo directo.
 */
const itemClassName =
  "relative z-[1] flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive>) {
  return <DropdownMenuPrimitive data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuContentPrimitive>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuContentPrimitive
        data-slot="dropdown-menu-content"
        className={cn(
          "bg-popover text-popover-foreground ring-foreground/10 z-50 min-w-40 rounded-lg p-1 shadow-md ring-1",
          className,
        )}
        {...props}
      >
        <DropdownMenuHighlight className="bg-accent absolute inset-0 z-0 rounded-md">
          {children}
        </DropdownMenuHighlight>
      </DropdownMenuContentPrimitive>
    </DropdownMenuPortal>
  );
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuItemPrimitive> & {
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuHighlightItem>
      <DropdownMenuItemPrimitive
        data-slot="dropdown-menu-item"
        data-variant={variant}
        className={cn(
          itemClassName,
          "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive",
          className,
        )}
        {...props}
      />
    </DropdownMenuHighlightItem>
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabelPrimitive>) {
  return (
    <DropdownMenuLabelPrimitive
      data-slot="dropdown-menu-label"
      className={cn(
        "text-muted-foreground relative z-[1] px-1.5 py-1 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparatorPrimitive>) {
  return (
    <DropdownMenuSeparatorPrimitive
      data-slot="dropdown-menu-separator"
      className={cn("bg-border relative z-[1] -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuShortcutPrimitive>) {
  return (
    <DropdownMenuShortcutPrimitive
      data-slot="dropdown-menu-shortcut"
      className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  );
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTriggerPrimitive>) {
  return (
    <DropdownMenuHighlightItem>
      <DropdownMenuSubTriggerPrimitive
        data-slot="dropdown-menu-sub-trigger"
        className={cn(itemClassName, className)}
        {...props}
      >
        {children}
        <ChevronRightIcon className="ml-auto" />
      </DropdownMenuSubTriggerPrimitive>
    </DropdownMenuHighlightItem>
  );
}

function DropdownMenuSubContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContentPrimitive>) {
  return (
    <DropdownMenuSubContentPrimitive
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground ring-foreground/10 z-50 min-w-32 rounded-lg p-1 shadow-lg ring-1",
        className,
      )}
      {...props}
    >
      <DropdownMenuHighlight className="bg-accent absolute inset-0 z-0 rounded-md">
        {children}
      </DropdownMenuHighlight>
    </DropdownMenuSubContentPrimitive>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
};
