"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import * as React from "react";

import { ElectricBorder } from "@/components/effects/electric-border";
import { TextType } from "@/components/effects/text-type";
import { Eyebrow } from "@/components/landing/Eyebrow";
import { HeroCards } from "@/components/landing/HeroCards";
import { PillButton } from "@/components/landing/PillButton";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";

// Code splitting real: three.js/@react-three solo se descarga en el cliente,
// nunca bloquea el SSR de la landing.
const Beams = dynamic(() => import("@/components/effects/beams").then((m) => m.Beams), {
  ssr: false,
});

const DEFAULT_HEADLINE = "NoName";
const HEADLINE_CLASSNAME = cn(
  playfair.className,
  "text-[clamp(30px,5vw,108px)] leading-[0.94] font-semibold tracking-[-0.01em] text-[#f7f7f7] uppercase",
);

export function Hero() {
  const router = useRouter();
  const [activeText, setActiveText] = React.useState<string | null>(null);
  const headline = activeText ?? DEFAULT_HEADLINE;

  return (
    <section
      id="hero"
      className="relative z-[2] flex min-h-screen items-center justify-center overflow-hidden px-6 pt-32 pb-16 sm:px-10 lg:px-0 lg:pt-28"
    >
      <Beams
        className="absolute inset-0"
        beamWidth={3}
        beamHeight={30}
        beamNumber={20}
        lightColor="#ffffff"
        speed={2}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={30}
      />

      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="relative z-[2] w-full"
      >
        <div className="flex w-full flex-col gap-12 pl-8 lg:flex-row lg:items-center lg:gap-24 lg:py-14">
          <div className="flex flex-col justify-center gap-6 lg:flex-1">
            <Eyebrow>NoName</Eyebrow>
            {/* key={headline} obliga a remontar y retipear desde cero en cada cambio (hover in/out) */}
            <TextType
              key={headline}
              as="h1"
              text={headline}
              loop={false}
              typingSpeed={45}
              className={HEADLINE_CLASSNAME}
              cursorClassName="text-[#f7f7f7]"
            />
            <ElectricBorder
              color="#f7f7f7"
              chaos={0.1}
              speed={0.8}
              borderRadius={999}
              className="w-fit"
            >
              <PillButton
                variant="glass"
                className="px-4 py-2 text-[12.5px]"
                onClick={() => router.push("/login")}
              >
                Empezar
              </PillButton>
            </ElectricBorder>
          </div>

          <HeroCards onActiveTextChange={setActiveText} />
        </div>
      </motion.div>
    </section>
  );
}
