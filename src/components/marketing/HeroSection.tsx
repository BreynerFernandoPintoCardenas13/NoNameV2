"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Eyebrow } from "@/components/landing/Eyebrow";
import { PillButton } from "@/components/landing/PillButton";
import { playfair } from "@/lib/fonts";

// Prism usa WebGL vía OGL: solo se descarga/monta en el cliente, nunca
// bloquea el SSR del Hero.
const Prism = dynamic(() => import("@/components/ui/prism/Prism"), { ssr: false });

export function HeroSection() {
  return (
    <section
      id="detalles-hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-32 pb-20 sm:px-10"
    >
      <div className="absolute inset-0">
        <Prism
          animationType="rotate"
          timeScale={0.28}
          height={3.6}
          baseWidth={5.6}
          scale={3.2}
          hueShift={0.35}
          colorFrequency={0.9}
          noise={0.25}
          glow={1.1}
          suspendWhenOffscreen
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505]/10 via-[#050505]/35 to-[#050505]" />

      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 12 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center gap-6 text-center"
      >
        <Eyebrow>NONAME · GESTIÓN DE PROYECTOS + IA</Eyebrow>
        <h1
          className={`${playfair.className} text-[clamp(32px,6vw,72px)] leading-[1.05] font-semibold tracking-[-0.01em] text-[#f7f7f7]`}
        >
          De reuniones a tickets accionables, en tiempo real.
        </h1>
        <p className="max-w-xl text-[16px] leading-[1.7] text-white/70">
          &ldquo;Las empresas no compiten hoy por quién trabaja más horas, sino por quién convierte
          mejor el tiempo de su gente en resultados.&rdquo;
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <PillButton
            variant="solid"
            className="px-6 py-3 text-sm"
            onClick={() => {
              document.getElementById("detalles-cta")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Solicitar demostración
          </PillButton>
          <PillButton
            variant="glass"
            className="px-6 py-3 text-sm"
            onClick={() => {
              document.getElementById("detalles-problema")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ver cómo funciona
          </PillButton>
        </div>
      </motion.div>

      <motion.button
        type="button"
        aria-label="Bajar a la siguiente sección"
        onClick={() => {
          document.getElementById("detalles-problema")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="absolute bottom-8 left-1/2 z-[1] -translate-x-1/2 text-white/50 transition-colors hover:text-white"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="size-6" aria-hidden="true" />
      </motion.button>
    </section>
  );
}
