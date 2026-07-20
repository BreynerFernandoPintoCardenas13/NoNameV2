"use client";

import * as React from "react";

import { AnimatedLoader } from "@/components/shared/animated-loader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
};

/** Botón que reemplaza su contenido por AnimatedLoader mientras `loading` es true. */
export function LoadingButton({
  loading = false,
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} className={cn("relative", className)} {...props}>
      <span className={cn(loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <AnimatedLoader size="xs" />
        </span>
      )}
    </Button>
  );
}
