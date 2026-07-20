"use client";

import * as React from "react";

import styles from "./gradual-blur.module.css";

type Position = "top" | "bottom" | "left" | "right";
type Curve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";
type Target = "parent" | "page";
type PresetName =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "subtle"
  | "intense"
  | "smooth"
  | "sharp"
  | "header"
  | "footer"
  | "sidebar"
  | "page-header"
  | "page-footer";

export type GradualBlurProps = {
  position?: Position;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: Curve;
  responsive?: boolean;
  target?: Target;
  preset?: PresetName;
  hoverIntensity?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

type ResolvedConfig = Required<
  Omit<GradualBlurProps, "preset" | "width" | "onAnimationComplete" | "hoverIntensity">
> &
  Pick<GradualBlurProps, "width" | "onAnimationComplete" | "hoverIntensity">;

const DEFAULT_CONFIG: ResolvedConfig = {
  position: "bottom",
  strength: 2,
  height: "6rem",
  width: undefined,
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear",
  responsive: false,
  target: "parent",
  className: "",
  style: {},
  onAnimationComplete: undefined,
  hoverIntensity: undefined,
};

const PRESETS: Record<PresetName, Partial<GradualBlurProps>> = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
  "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 },
};

const CURVE_FUNCTIONS: Record<Curve, (progress: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const mergeConfigs = (...configs: Partial<GradualBlurProps>[]): ResolvedConfig =>
  configs.reduce((acc, c) => ({ ...acc, ...c }), {} as ResolvedConfig) as ResolvedConfig;

const getGradientDirection = (position: Position) =>
  ({ top: "to top", bottom: "to bottom", left: "to left", right: "to right" })[position] ??
  "to bottom";

function useIntersectionObserver(
  ref: React.RefObject<HTMLDivElement | null>,
  shouldObserve: boolean,
) {
  const [isVisible, setIsVisible] = React.useState(!shouldObserve);

  React.useEffect(() => {
    if (!shouldObserve || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
}

/**
 * Overlay de blur progresivo (React Bits, adaptado a TS + CSS Modules — sin la
 * inyección de <style> en runtime del original). `mathjs` listado en la fuente no se
 * usa en esta variante; se omite para no añadir una dependencia sin uso.
 */
function GradualBlurComponent(props: GradualBlurProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const config = React.useMemo(() => {
    const presetConfig = props.preset ? PRESETS[props.preset] : {};
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props);
  }, [props]);

  const isVisible = useIntersectionObserver(containerRef, config.animated === "scroll");

  const blurDivs = React.useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / config.divCount;
    const currentStrength =
      isHovered && config.hoverIntensity
        ? config.strength * config.hoverIntensity
        : config.strength;
    const curveFunc = CURVE_FUNCTIONS[config.curve] ?? CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= config.divCount; i++) {
      const progress = curveFunc(i / config.divCount);

      const blurValue = config.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * currentStrength
        : 0.0625 * (progress * config.divCount + 1) * currentStrength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position);

      const divStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
        transition:
          config.animated && config.animated !== "scroll"
            ? `backdrop-filter ${config.duration} ${config.easing}`
            : undefined,
      };

      divs.push(<div key={i} style={divStyle} />);
    }

    return divs;
  }, [config, isHovered]);

  const containerStyle = React.useMemo<React.CSSProperties>(() => {
    const isVertical = config.position === "top" || config.position === "bottom";
    const isHorizontal = config.position === "left" || config.position === "right";
    const isPageTarget = config.target === "page";

    const baseStyle: React.CSSProperties = {
      position: isPageTarget ? "fixed" : "absolute",
      pointerEvents: config.hoverIntensity ? "auto" : "none",
      opacity: isVisible ? 1 : 0,
      transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
      zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style,
    };

    if (isVertical) {
      baseStyle.height = config.height;
      baseStyle.width = config.width || "100%";
      baseStyle[config.position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = config.width || config.height;
      baseStyle.height = "100%";
      baseStyle[config.position] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, isVisible]);

  const { hoverIntensity, animated, onAnimationComplete, duration } = config;

  React.useEffect(() => {
    if (isVisible && animated === "scroll" && onAnimationComplete) {
      const ms = parseFloat(duration) * 1000;
      const timer = setTimeout(() => onAnimationComplete(), ms);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animated, onAnimationComplete, duration]);

  return (
    <div
      ref={containerRef}
      className={`${styles.gradualBlur} ${config.target === "page" ? "" : styles.gradualBlurParent} ${config.className}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className={styles.gradualBlurInner}>{blurDivs}</div>
    </div>
  );
}

export const GradualBlur = React.memo(GradualBlurComponent);
GradualBlur.displayName = "GradualBlur";
