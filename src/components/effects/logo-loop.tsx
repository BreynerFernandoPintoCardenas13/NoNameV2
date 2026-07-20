"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import styles from "./logo-loop.module.css";

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

type LogoNodeItem = {
  node: React.ReactNode;
  title?: string;
  href?: string;
  ariaLabel?: string;
};

type LogoImageItem = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  href?: string;
};

export type LogoItem = LogoNodeItem | LogoImageItem;

export type LogoLoopProps = {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  renderItem?: (item: LogoItem, key: React.Key) => React.ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
};

const toCssLength = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

function useResizeObserver(
  callback: () => void,
  elements: React.RefObject<HTMLElement | null>[],
  deps: React.DependencyList,
) {
  React.useEffect(() => {
    if (!window.ResizeObserver) {
      window.addEventListener("resize", callback);
      callback();
      return () => window.removeEventListener("resize", callback);
    }
    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => observers.forEach((observer) => observer?.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- elements/callback intentionally re-subscribe alongside deps
  }, deps);
}

function useImageLoader(
  seqRef: React.RefObject<HTMLElement | null>,
  onLoad: () => void,
  deps: React.DependencyList,
) {
  React.useEffect(() => {
    const images = seqRef.current?.querySelectorAll("img") ?? [];
    if (images.length === 0) {
      onLoad();
      return;
    }
    let remaining = images.length;
    const handleLoad = () => {
      remaining -= 1;
      if (remaining === 0) onLoad();
    };
    images.forEach((img) => {
      if (img.complete) handleLoad();
      else {
        img.addEventListener("load", handleLoad, { once: true });
        img.addEventListener("error", handleLoad, { once: true });
      }
    });
    return () => {
      images.forEach((img) => {
        img.removeEventListener("load", handleLoad);
        img.removeEventListener("error", handleLoad);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally drive re-measurement
  }, deps);
}

function useAnimationLoop(
  trackRef: React.RefObject<HTMLDivElement | null>,
  targetVelocity: number,
  seqWidth: number,
  seqHeight: number,
  isHovered: boolean,
  hoverSpeed: number | undefined,
  isVertical: boolean,
) {
  const rafRef = React.useRef<number | null>(null);
  const lastTimestampRef = React.useRef<number | null>(null);
  const offsetRef = React.useRef(0);
  const velocityRef = React.useRef(0);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const seqSize = isVertical ? seqHeight : seqWidth;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      track.style.transform = isVertical
        ? `translate3d(0, ${-offsetRef.current}px, 0)`
        : `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) lastTimestampRef.current = timestamp;
      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;
      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      if (seqSize > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
        offsetRef.current = nextOffset;
        track.style.transform = isVertical
          ? `translate3d(0, ${-offsetRef.current}px, 0)`
          : `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimestampRef.current = null;
    };
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, trackRef]);
}

/** Loop infinito de logos (React Bits, adaptado a TS + CSS Modules; fade tomado de los tokens del tema). */
export const LogoLoop = React.memo(function LogoLoop({
  logos,
  speed = 120,
  direction = "left",
  width = "100%",
  logoHeight = 28,
  gap = 32,
  hoverSpeed,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  renderItem,
  ariaLabel = "Partner logos",
  className,
  style,
}: LogoLoopProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const seqRef = React.useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = React.useState(0);
  const [seqHeight, setSeqHeight] = React.useState(0);
  const [copyCount, setCopyCount] = React.useState(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = React.useState(false);

  const isVertical = direction === "up" || direction === "down";

  const targetVelocity = React.useMemo(() => {
    const magnitude = Math.abs(speed);
    const directionMultiplier = isVertical
      ? direction === "up"
        ? 1
        : -1
      : direction === "left"
        ? 1
        : -1;
    const speedMultiplier = speed < 0 ? -1 : 1;
    return magnitude * directionMultiplier * speedMultiplier;
  }, [speed, direction, isVertical]);

  const updateDimensions = React.useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const sequenceRect = seqRef.current?.getBoundingClientRect?.();
    const sequenceWidth = sequenceRect?.width ?? 0;
    const sequenceHeight = sequenceRect?.height ?? 0;

    if (isVertical) {
      const parentHeight = containerRef.current?.parentElement?.clientHeight ?? 0;
      if (containerRef.current && parentHeight > 0) {
        const targetHeight = Math.ceil(parentHeight);
        if (containerRef.current.style.height !== `${targetHeight}px`)
          containerRef.current.style.height = `${targetHeight}px`;
      }
      if (sequenceHeight > 0) {
        setSeqHeight(Math.ceil(sequenceHeight));
        const viewport = containerRef.current?.clientHeight ?? parentHeight ?? sequenceHeight;
        const copiesNeeded = Math.ceil(viewport / sequenceHeight) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
      }
    } else if (sequenceWidth > 0) {
      setSeqWidth(Math.ceil(sequenceWidth));
      const copiesNeeded =
        Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, [isVertical]);

  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight, isVertical]);
  useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight, isVertical]);
  useAnimationLoop(
    trackRef,
    targetVelocity,
    seqWidth,
    seqHeight,
    isHovered,
    hoverSpeed,
    isVertical,
  );

  const cssVariables = {
    "--logoloop-gap": `${gap}px`,
    "--logoloop-logoHeight": `${logoHeight}px`,
    ...(fadeOutColor && { "--logoloop-fadeColor": fadeOutColor }),
  } as React.CSSProperties;

  const handleMouseEnter = React.useCallback(() => {
    if (hoverSpeed !== undefined) setIsHovered(true);
  }, [hoverSpeed]);
  const handleMouseLeave = React.useCallback(() => {
    if (hoverSpeed !== undefined) setIsHovered(false);
  }, [hoverSpeed]);

  const renderLogoItem = React.useCallback(
    (item: LogoItem, key: React.Key) => {
      if (renderItem) {
        return (
          <li className={styles.item} key={key} role="listitem">
            {renderItem(item, key)}
          </li>
        );
      }

      const isNodeItem = "node" in item;
      const content = isNodeItem ? (
        <span className={styles.node} aria-hidden={!!item.href && !item.ariaLabel}>
          {item.node}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- logos vienen de rutas dinámicas del consumidor
        <img
          src={item.src}
          srcSet={item.srcSet}
          sizes={item.sizes}
          width={item.width}
          height={item.height}
          alt={item.alt ?? ""}
          title={item.title}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );

      const itemAriaLabel = isNodeItem ? (item.ariaLabel ?? item.title) : item.alt;
      const itemContent = item.href ? (
        <a
          className={styles.link}
          href={item.href}
          aria-label={itemAriaLabel || "logo link"}
          target="_blank"
          rel="noreferrer noopener"
        >
          {content}
        </a>
      ) : (
        content
      );

      return (
        <li className={styles.item} key={key} role="listitem">
          {itemContent}
        </li>
      );
    },
    [renderItem],
  );

  const logoLists = React.useMemo(
    () =>
      Array.from({ length: copyCount }, (_, copyIndex) => (
        <ul
          className={styles.list}
          key={`copy-${copyIndex}`}
          role="list"
          aria-hidden={copyIndex > 0}
          ref={copyIndex === 0 ? seqRef : undefined}
        >
          {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`))}
        </ul>
      )),
    [copyCount, logos, renderLogoItem],
  );

  const containerStyle: React.CSSProperties = {
    width: isVertical
      ? toCssLength(width) === "100%"
        ? undefined
        : toCssLength(width)
      : (toCssLength(width) ?? "100%"),
    ...cssVariables,
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        styles.logoloop,
        isVertical ? styles.vertical : undefined,
        fadeOut && styles.fade,
        scaleOnHover && styles.scaleHover,
        className,
      )}
      style={containerStyle}
      role="region"
      aria-label={ariaLabel}
    >
      <div
        className={styles.track}
        ref={trackRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {logoLists}
      </div>
    </div>
  );
});

LogoLoop.displayName = "LogoLoop";
