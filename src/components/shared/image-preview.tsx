import * as React from "react";

import { DraggableSpring } from "@/components/shared/draggable-spring";
import { cn } from "@/lib/utils";

type ImagePreviewProps = React.ComponentProps<"img"> & {
  /** Habilita arrastre con retorno elástico (animate-ui Spring). */
  draggable?: boolean;
};

/** Preview de imagen (insertada en notas, adjuntos, etc.) con física de arrastre opcional. */
export function ImagePreview({ draggable = true, className, alt, ...props }: ImagePreviewProps) {
  const node = (
    // eslint-disable-next-line @next/next/no-img-element -- origen dinámico/externo, sin dominios configurados
    <img
      alt={alt}
      className={cn(
        "ring-foreground/10 rounded-lg shadow-lg ring-1 shadow-black/20 select-none",
        className,
      )}
      {...props}
    />
  );

  return draggable ? <DraggableSpring>{node}</DraggableSpring> : node;
}
