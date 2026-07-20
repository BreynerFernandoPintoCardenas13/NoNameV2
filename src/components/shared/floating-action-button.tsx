import * as React from "react";

import { Button } from "@/components/ui/button";
import { DraggableSpring } from "@/components/shared/draggable-spring";
import { cn } from "@/lib/utils";

type FloatingActionButtonProps = React.ComponentProps<typeof Button> & {
  /** Habilita arrastre con retorno elástico (animate-ui Spring). */
  draggable?: boolean;
};

/** Acción flotante (FAB). Base para paneles/acciones flotantes de la app. */
export function FloatingActionButton({
  draggable = false,
  className,
  size = "icon-lg",
  ...props
}: FloatingActionButtonProps) {
  const node = (
    <Button
      size={size}
      className={cn("rounded-full shadow-lg shadow-black/30", className)}
      {...props}
    />
  );

  return draggable ? <DraggableSpring>{node}</DraggableSpring> : node;
}
