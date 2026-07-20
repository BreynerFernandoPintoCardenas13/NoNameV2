"use client";

import * as React from "react";
import { gsap } from "gsap";

import { cn } from "@/lib/utils";
import styles from "./text-type.module.css";

export type TextTypeProps = {
  text: string | string[];
  as?: React.ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
};

/**
 * TextType (React Bits) — máquina de escribir con cursor animado por GSAP. Portado
 * tal cual del código fuente compartido, a TypeScript + CSS Modules. Para retipear
 * desde cero al cambiar `text` externamente (p. ej. al hacer hover), monta con
 * `key={text}` — el componente no se reinicia solo si `text` cambia en caliente.
 */
export function TextType({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className,
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName,
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = React.useState("");
  const [currentCharIndex, setCurrentCharIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(!startOnVisible);
  const cursorRef = React.useRef<HTMLSpanElement>(null);
  const containerRef = React.useRef<HTMLElement>(null);

  const textArray = React.useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = React.useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const currentTextColor =
    textColors.length === 0 ? "inherit" : textColors[currentTextIndex % textColors.length];

  React.useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  React.useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  React.useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout>;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode ? currentText.split("").reverse().join("") : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === "") {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) return;

          onSentenceComplete?.(textArray[currentTextIndex], currentTextIndex);

          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText((prev) => prev + processedText[currentCharIndex]);
              setCurrentCharIndex((prev) => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed,
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- puerto fiel del original: el efecto orquesta su propio ciclo de estado
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return React.createElement(
    Component,
    { ref: containerRef, className: cn(styles.textType, className) },
    <span key="content" className={styles.content} style={{ color: currentTextColor }}>
      {displayedText}
    </span>,
    showCursor && (
      <span
        key="cursor"
        ref={cursorRef}
        className={cn(styles.cursor, cursorClassName, shouldHideCursor && styles.cursorHidden)}
      >
        {cursorCharacter}
      </span>
    ),
  );
}
