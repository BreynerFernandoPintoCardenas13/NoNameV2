import * as React from "react";

import { GradualBlur } from "@/components/effects/gradual-blur";
import { BackgroundDecor } from "@/components/landing/BackgroundDecor";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { QueHaceSection } from "@/components/landing/QueHaceSection";
import { QuienLoHizoSection } from "@/components/landing/QuienLoHizoSection";
import { TechLoop } from "@/components/landing/TechLoop";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";

/** Landing pública — sin backend todavía; los botones solo dejan la navegación preparada. */
export function Landing() {
  return (
    <div
      className={cn(
        inter.className,
        "relative min-h-screen overflow-x-hidden",
        "bg-[linear-gradient(180deg,#050505_0%,#0a0a0a_12%,#1c1c1c_30%,#4a4a48_55%,#b8b6b0_78%,#f7f7f7_100%)]",
      )}
    >
      <BackgroundDecor />
      <Navbar />

      <GradualBlur
        target="page"
        position="top"
        height="8rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential
        opacity={1}
        style={{ zIndex: 40 }}
      />
      <GradualBlur
        target="page"
        position="bottom"
        height="8rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential
        opacity={1}
        style={{ zIndex: 40 }}
      />

      <Hero />
      <TechLoop className="relative z-[2] border-y border-white/[0.06] bg-black/30 py-8 backdrop-blur-sm" />
      <QueHaceSection />
      <QuienLoHizoSection />
      <Footer />
    </div>
  );
}
