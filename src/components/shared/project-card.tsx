"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverLift } from "@/components/shared/hover-lift";
import { cn } from "@/lib/utils";

type ProjectCardProps = React.ComponentProps<typeof Card> & {
  title: string;
  description?: string;
  footer?: React.ReactNode;
};

export function ProjectCard({
  title,
  description,
  footer,
  className,
  children,
  ...props
}: ProjectCardProps) {
  return (
    <HoverLift>
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-lg hover:shadow-black/20",
          className,
        )}
        {...props}
      >
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
        {footer}
      </Card>
    </HoverLift>
  );
}
