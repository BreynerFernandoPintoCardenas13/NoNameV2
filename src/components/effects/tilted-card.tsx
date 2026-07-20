"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { StaticImageData } from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";
import styles from "./tilted-card.module.css";

const SPRING_VALUES = { damping: 30, stiffness: 100, mass: 2 };

export type TiltedCardProps = {
  /** Modo imagen (fiel al original). Omite `imageSrc` y usa `children` para contenido arbitrario. */
  imageSrc?: string | StaticImageData;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  /** Contenido no-imagen a inclinar (p. ej. una mini card de texto). Ignorado si hay `imageSrc`. */
  children?: React.ReactNode;
  /** Fondo del bloque que se inclina (`.inner`). Útil en modo `children` sin fondo propio. */
  backgroundColor?: string;
  className?: string;
  onHoverChange?: (hovered: boolean) => void;
};

/**
 * TiltedCard (React Bits) — tilt 3D + spring físico según la posición del cursor.
 * Portado del código fuente compartido; se extendió con un modo `children` (además
 * del modo `imageSrc` original) para poder inclinar contenido que no es una imagen.
 */
export function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  backgroundColor = "transparent",
  children,
  className,
  onHoverChange,
}: TiltedCardProps) {
  const ref = React.useRef<HTMLElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), SPRING_VALUES);
  const rotateY = useSpring(useMotionValue(0), SPRING_VALUES);
  const scale = useSpring(1, SPRING_VALUES);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });

  const lastYRef = React.useRef(0);
  const isImageMode = Boolean(imageSrc);

  function handleMouse(e: React.MouseEvent<HTMLElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastYRef.current;
    rotateFigcaption.set(-velocityY * 0.6);
    lastYRef.current = offsetY;
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
    onHoverChange?.(true);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
    onHoverChange?.(false);
  }

  return (
    <figure
      ref={ref}
      className={cn(styles.figure, className)}
      style={{ height: containerHeight, width: containerWidth }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className={styles.mobileAlert}>Este efecto no está optimizado para mobile.</div>
      )}

      <motion.div
        className={styles.inner}
        style={{
          width: isImageMode ? imageWidth : "100%",
          height: isImageMode ? imageHeight : "100%",
          backgroundColor,
          rotateX,
          rotateY,
          scale,
        }}
      >
        {isImageMode ? (
          <motion.img
            src={typeof imageSrc === "string" ? imageSrc : imageSrc?.src}
            alt={altText}
            className={styles.img}
            style={{ width: imageWidth, height: imageHeight }}
          />
        ) : (
          children
        )}

        {displayOverlayContent && overlayContent && (
          <motion.div className={styles.overlay}>{overlayContent}</motion.div>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className={styles.caption}
          style={{ x, y, opacity, rotate: rotateFigcaption }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
