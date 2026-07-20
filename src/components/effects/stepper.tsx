"use client";

import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

import styles from "./stepper.module.css";

/**
 * Port TS del Stepper de React Bits (variante JS + CSS), con la paleta del
 * sitio (negro/blanco/grises, sin colores vivos). Se eliminaron los
 * aspect-ratio del contenedor demo para que funcione dentro de un modal.
 */

export interface StepperProps {
  children: React.ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  disableStepIndicators?: boolean;
}

export function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName,
  stepContainerClassName,
  contentClassName,
  footerClassName,
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "Atrás",
  nextButtonText = "Continuar",
  completeButtonText = "Finalizar",
  disableStepIndicators = false,
}: StepperProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [direction, setDirection] = React.useState(0);
  const stepsArray = React.Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className={styles.outerContainer}>
      <div className={cn(styles.stepCircleContainer, stepCircleContainerClassName)}>
        <div className={cn(styles.stepIndicatorRow, stepContainerClassName)}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  disableStepIndicators={disableStepIndicators}
                  currentStep={currentStep}
                  onClickStep={(clicked) => {
                    setDirection(clicked > currentStep ? 1 : -1);
                    updateStep(clicked);
                  }}
                />
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={cn(styles.stepContentDefault, contentClassName)}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={cn(styles.footerContainer, footerClassName)}>
            <div className={cn(styles.footerNav, currentStep !== 1 ? styles.spread : styles.end)}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={styles.backButton}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className={styles.nextButton}
                {...nextButtonProps}
              >
                {isLastStep ? completeButtonText : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: React.ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className,
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = React.useState(0);

  return (
    <motion.div
      className={className}
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: "spring", duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: React.ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: "absolute", left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "50%" : "-50%", opacity: 0 }),
};

export function Step({ children }: { children: React.ReactNode }) {
  return <div className={styles.stepDefault}>{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (step: number) => void;
  disableStepIndicators: boolean;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators,
}: StepIndicatorProps) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <motion.div
      onClick={handleClick}
      className={styles.stepIndicator}
      style={disableStepIndicators ? { pointerEvents: "none", opacity: 0.6 } : {}}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: "#222222", color: "#a3a3a3" },
          active: { scale: 1, backgroundColor: "#f7f7f7", color: "#050505" },
          complete: { scale: 1, backgroundColor: "#f7f7f7", color: "#050505" },
        }}
        transition={{ duration: 0.3 }}
        className={styles.stepIndicatorInner}
      >
        {status === "complete" ? (
          <CheckIcon className={styles.checkIcon} />
        ) : status === "active" ? (
          <div className={styles.activeDot} />
        ) : (
          <span className={styles.stepNumber}>{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: "transparent" },
    complete: { width: "100%", backgroundColor: "#f7f7f7" },
  };

  return (
    <div className={styles.stepConnector}>
      <motion.div
        className={styles.stepConnectorInner}
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: "tween", ease: "easeOut", duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
