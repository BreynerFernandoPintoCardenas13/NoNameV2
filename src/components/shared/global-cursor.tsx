"use client";

import * as React from "react";

import {
  Cursor,
  CursorFollow,
  CursorProvider,
} from "@/components/animate-ui/primitives/animate/cursor";
import { cn } from "@/lib/utils";

const INTERACTIVE_SELECTOR =
  "button, a, [role='button'], input, textarea, select, [data-cursor-interactive]";

function GlobalCursorDot() {
  const [hovering, setHovering] = React.useState(false);

  React.useEffect(() => {
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      setHovering(!!target?.closest(INTERACTIVE_SELECTOR));
    };
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    return () => window.removeEventListener("pointerover", onPointerOver);
  }, []);

  return (
    <>
      <Cursor transition={{ type: "spring", stiffness: 500, damping: 40 }}>
        <div
          className={cn(
            "bg-foreground rounded-full mix-blend-difference",
            hovering ? "size-6" : "size-2.5",
          )}
        />
      </Cursor>
      <CursorFollow transition={{ stiffness: 300, damping: 35 }}>
        <div
          className={cn(
            "border-foreground/15 bg-foreground/5 rounded-full border backdrop-blur-sm",
            hovering ? "size-10" : "size-6",
          )}
        />
      </CursorFollow>
    </>
  );
}

export function GlobalCursorProvider({ children }: { children: React.ReactNode }) {
  return (
    <CursorProvider global>
      <GlobalCursorDot />
      {children}
    </CursorProvider>
  );
}
