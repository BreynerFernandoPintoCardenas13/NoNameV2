"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import {
  Accordion as AccordionPrimitive,
  AccordionContent as AccordionContentPrimitive,
  AccordionItem as AccordionItemPrimitive,
  AccordionTrigger as AccordionTriggerPrimitive,
  useAccordionItem,
} from "@/components/animate-ui/primitives/radix/accordion";
import { cn } from "@/lib/utils";

/**
 * Accordion único del proyecto (sobre animate-ui + Radix). Úsalo en configuraciones
 * avanzadas, información de proyecto/ticket, documentación, ayuda y panel de IA.
 */
function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive>) {
  return (
    <AccordionPrimitive
      data-slot="accordion"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionItemPrimitive>) {
  return (
    <AccordionItemPrimitive
      data-slot="accordion-item"
      className={cn("border-border border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionTriggerPrimitive>) {
  const { isOpen } = useAccordionItem();

  return (
    <AccordionTriggerPrimitive
      data-slot="accordion-trigger"
      className={cn(
        "hover:text-foreground text-foreground flex w-full flex-1 items-center justify-between gap-2 py-3 text-left text-sm font-medium outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </AccordionTriggerPrimitive>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionContentPrimitive>) {
  return (
    <AccordionContentPrimitive data-slot="accordion-content" {...props}>
      <div className={cn("text-muted-foreground pb-3 text-sm", className)}>{children}</div>
    </AccordionContentPrimitive>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
