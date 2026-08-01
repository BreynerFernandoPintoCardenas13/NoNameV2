"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatCounter } from "@/components/marketing/StatCounter";
import { playfair } from "@/lib/fonts";

const LineWaves = dynamic(() => import("@/components/ui/line-waves/LineWaves"), { ssr: false });

const KPIS = [
  { value: 15, suffix: " h", label: "recuperadas por PM, cada mes" },
  { value: 60, suffix: " h", label: "devueltas al equipo de 4 PMs, cada mes" },
  { value: 720, suffix: " h", label: "al año — casi 4 meses de una persona de tiempo completo" },
] as const;

/** Sección 7 — Productividad: fondo LineWaves sutil + KPIs de horas recuperadas. */
export function ProductivitySection() {
  return (
    <section
      id="detalles-productividad"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="absolute inset-0 opacity-[0.16]">
        <LineWaves
          speed={0.22}
          innerLineCount={28}
          outerLineCount={32}
          warpIntensity={0.8}
          rotation={-35}
          brightness={0.16}
          color1="#f7f7f7"
          color2="#dcdce6"
          color3="#ffffff"
          enableMouseInteraction
          mouseInfluence={1.2}
        />
      </div>
      <div className="absolute inset-0 bg-[#050505]/55" />

      <div className="relative z-[1] mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="INCREMENTO DE PRODUCTIVIDAD"
          title="Ese tiempo no se pierde — se reinvierte."
          description="Un PM que recupera 15 horas al mes no las pierde: las reinvierte en priorización, calidad y anticipación de riesgos."
          align="center"
          className="mx-auto"
        />

        <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-3">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-xl"
            >
              <StatCounter
                value={kpi.value}
                suffix={kpi.suffix}
                className={`${playfair.className} block text-[clamp(34px,4.4vw,52px)] font-semibold text-[#f7f7f7]`}
              />
              <p className="mt-3 text-[13px] leading-[1.55] text-white/60">{kpi.label}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-[12.5px] leading-[1.6] text-white/40">
          Referencia internacional de magnitud: McKinsey estima que la IA generativa puede
          automatizar entre 60% y 70% del tiempo hoy dedicado a funciones de conocimiento.
        </p>
      </div>
    </section>
  );
}
