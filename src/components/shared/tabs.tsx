"use client";

import * as React from "react";

import {
  Tabs as TabsPrimitive,
  TabsContent as TabsContentPrimitive,
  TabsContents as TabsContentsPrimitive,
  TabsHighlight,
  TabsHighlightItem,
  TabsList as TabsListPrimitive,
  TabsTrigger as TabsTriggerPrimitive,
} from "@/components/animate-ui/primitives/animate/tabs";
import { cn } from "@/lib/utils";

/**
 * Tabs únicas del proyecto (sobre animate-ui). Reemplaza cualquier implementación
 * de pestañas tradicional: Configuración, vista de Proyecto, Tickets, etc.
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive>) {
  return (
    <TabsPrimitive data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

type TabsListProps = React.ComponentProps<typeof TabsListPrimitive>;

function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <TabsHighlight className="bg-background absolute inset-0 z-0 rounded-lg shadow-sm">
      <TabsListPrimitive
        data-slot="tabs-list"
        className={cn(
          "bg-muted/60 relative inline-flex h-9 w-fit items-center gap-1 rounded-lg p-1",
          className,
        )}
        {...props}
      >
        {children}
      </TabsListPrimitive>
    </TabsHighlight>
  );
}

type TabsTriggerProps = React.ComponentProps<typeof TabsTriggerPrimitive>;

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  return (
    <TabsHighlightItem value={value} className="h-full flex-1">
      <TabsTriggerPrimitive
        data-slot="tabs-trigger"
        value={value}
        className={cn(
          "text-muted-foreground data-[state=active]:text-foreground relative z-10 inline-flex h-full w-full items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none",
          className,
        )}
        {...props}
      />
    </TabsHighlightItem>
  );
}

function TabsContents({ className, ...props }: React.ComponentProps<typeof TabsContentsPrimitive>) {
  return <TabsContentsPrimitive data-slot="tabs-contents" className={className} {...props} />;
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsContentPrimitive>) {
  return (
    <TabsContentPrimitive data-slot="tabs-content" className={cn("pt-1", className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent };
