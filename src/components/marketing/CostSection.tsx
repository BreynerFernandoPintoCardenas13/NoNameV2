"use client";

import { motion } from "motion/react";
import * as React from "react";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatCounter } from "@/components/marketing/StatCounter";
import { playfair } from "@/lib/fonts";

const COMPARISONS = [
  {
    process: "Documentar una reunión y redactar los tickets",
    before: "45–60 min",
    after: "10–15 min",
    improvement: 75,
  },
  {
    process: "Crear cada ticket en OpenProject",
    before: "8–10 min/ticket",
    after: "Automático",
    improvement: 90,
  },
  {
    process: "Consolidar métricas para un comité gerencial",
    before: "2–3 h/semana",
    after: "Instantáneo",
    improvement: 95,
  },
  {
    process: "Recuperar contexto de un proyecto anterior",
    before: "15–30 min/búsqueda",
    after: "Centralizado",
    improvement: 80,
  },
] as const;

/** Sección 3 — El costo oculto: comparación antes/después, con look de dashboard. */
export function CostSection() {
  return (
    <section
      id="detalles-costo"
      className="relative overflow-hidden bg-[#08080a] px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="relative mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="EL COSTO OCULTO"
          title="Tiempo que nadie presupuesta, pero que la empresa paga cada mes."
          description="Antes y después de automatizar el eslabón más repetitivo de la gestión de proyectos."
        />

        <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl sm:mt-16">
          {COMPARISONS.map((row, i) => (
            <div
              key={row.process}
              className={
                "grid grid-cols-1 gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8" +
                (i > 0 ? " border-t border-white/[0.08]" : "")
              }
            >
              <div>
                <h3 className="text-[14.5px] font-medium text-[#f7f7f7]">{row.process}</h3>
                <div className="mt-3 flex items-center gap-3 text-[12.5px] text-white/55">
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1">{row.before}</span>
                  <span aria-hidden="true">→</span>
                  <span className="rounded-full bg-white/[0.14] px-2.5 py-1 text-white/80">
                    {row.after}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:w-48">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full rounded-full bg-[#f7f7f7]"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${row.improvement}%` }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <StatCounter
                  value={row.improvement}
                  prefix="≈"
                  suffix="%"
                  className={`${playfair.className} w-14 shrink-0 text-right text-[18px] font-semibold text-[#f7f7f7]`}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-[12.5px] leading-[1.6] text-white/40">
          Estimaciones operativas basadas en tiempos típicos de gestión de proyectos y en la
          arquitectura funcional de NoName — se recomienda validarlas con los tiempos reales de su
          organización durante una prueba piloto.
        </p>
      </div>
    </section>
  );
}
