"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const BENEFITS = [
  {
    was: '"Genera reportes"',
    gives: "Decisiones respaldadas por información en tiempo real, no por intuición.",
  },
  {
    was: '"Transcribe audio"',
    gives: "Horas devueltas a su equipo de liderazgo, todas las semanas.",
  },
  {
    was: '"Crea tickets en OpenProject"',
    gives: "Cero fricción entre lo que se decide en la reunión y lo que se ejecuta.",
  },
  {
    was: '"Tiene un panel de administración"',
    gives: "Visibilidad total del desempeño del equipo, sin pedirle un informe a nadie.",
  },
  {
    was: '"Guarda una base de conocimiento"',
    gives: "Continuidad del proyecto aunque cambien las personas que lo llevan.",
  },
  {
    was: '"Usa inteligencia artificial"',
    gives: "Redacción profesional y consistente de cada tarea, sin depender de quién la escribió.",
  },
] as const;

/** Sección 9 — Beneficios: no lo que hace, sino lo que entrega (tabla del doc, en cards). */
export function BenefitsSection() {
  return (
    <ScrollRevealSection id="detalles-beneficios" className="relative px-6 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="BENEFICIOS" title="No lo que hace. Lo que le entrega." />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.was}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
            >
              <CheckCircle2 className="size-5 text-white/70" aria-hidden="true" />
              <p className="mt-4 text-[13px] text-white/40 line-through decoration-white/25">
                {benefit.was}
              </p>
              <p className="mt-2 text-[14.5px] leading-[1.55] font-medium text-[#f7f7f7]">
                {benefit.gives}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
