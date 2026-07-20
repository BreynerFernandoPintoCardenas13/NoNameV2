import * as React from "react";
import type { StaticImageData } from "next/image";

import { Avatar as AvatarPrimitive, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DraggableSpring } from "@/components/shared/draggable-spring";

type AvatarProps = React.ComponentProps<typeof AvatarPrimitive> & {
  /** Acepta una URL o un import estático de next/image (`import x from "@/assets/..."`). */
  src?: string | StaticImageData;
  alt?: string;
  fallback: string;
  fallbackClassName?: string;
  /** Habilita arrastre con retorno elástico (animate-ui Spring). */
  draggable?: boolean;
};

export function Avatar({
  src,
  alt,
  fallback,
  fallbackClassName,
  draggable = false,
  ...props
}: AvatarProps) {
  const resolvedSrc = typeof src === "string" ? src : src?.src;

  const node = (
    <AvatarPrimitive {...props}>
      {resolvedSrc && <AvatarImage src={resolvedSrc} alt={alt ?? fallback} />}
      <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
    </AvatarPrimitive>
  );

  return draggable ? <DraggableSpring>{node}</DraggableSpring> : node;
}
