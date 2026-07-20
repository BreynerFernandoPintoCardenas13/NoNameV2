"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverLift } from "@/components/shared/hover-lift";
import { cn } from "@/lib/utils";

type NoteCardProps = React.ComponentProps<typeof Card> & {
  title: string;
  excerpt?: string;
  updatedAt?: string;
};

export function NoteCard({ title, excerpt, updatedAt, className, ...props }: NoteCardProps) {
  return (
    <HoverLift>
      <Card
        size="sm"
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-lg hover:shadow-black/20",
          className,
        )}
        {...props}
      >
        <CardHeader>
          <CardTitle className="truncate">{title}</CardTitle>
        </CardHeader>
        {(excerpt || updatedAt) && (
          <CardContent className="flex flex-col gap-1">
            {excerpt && <p className="text-muted-foreground line-clamp-2 text-sm">{excerpt}</p>}
            {updatedAt && <p className="text-muted-foreground/70 text-xs">{updatedAt}</p>}
          </CardContent>
        )}
      </Card>
    </HoverLift>
  );
}
