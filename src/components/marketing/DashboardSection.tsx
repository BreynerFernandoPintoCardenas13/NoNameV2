"use client";

import { motion } from "motion/react";
import * as React from "react";
import { Activity, TrendingUp, Users } from "lucide-react";

import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const BARS = [42, 68, 55, 81, 60, 90, 74] as const;

const FLOATING_CARDS = [
  { icon: Users, label: "Ranking de desarrolladores", className: "top-4 -left-4 sm:-left-10" },
  { icon: TrendingUp, label: "Tendencias de carga", className: "-top-6 -right-2 sm:-right-8" },
  { icon: Activity, label: "Actividad reciente", className: "-bottom-6 left-6 sm:left-16" },
] as const;

/**
 * Sección 6 — Dashboard: mockup ilustrativo (no capturas reales) del panel
 * administrativo, con cifras de ejemplo puramente visuales.
 */
export function DashboardSection() {
  return (
    <ScrollRevealSection
      id="detalles-dashboard"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="PANEL ADMINISTRATIVO"
          title="Visibilidad ejecutiva, sin pedirle un informe a nadie."
          description="Tickets por PM, horas por proyecto, ranking de desarrolladores y actividad reciente — leídos en vivo desde OpenProject."
          align="center"
          className="mx-auto"
        />

        <div className="relative mx-auto mt-20 max-w-2xl sm:mt-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-[12px] tracking-[0.04em] text-white/45">
                TICKETS POR SEMANA
              </span>
              <span className="text-[12px] text-white/45">Últimas 7 semanas</span>
            </div>
            <div className="mt-6 flex h-32 items-end gap-2.5">
              {BARS.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-white/20 to-white/70"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                />
              ))}
            </div>
          </div>

          {FLOATING_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              className={`absolute hidden w-44 sm:block ${card.className}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
            >
              {/* Anidado: el padre resuelve la entrada (whileInView), este hijo
                  corre el flotado infinito sin pisar esa animación de entrada. */}
              <motion.div
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <card.icon className="size-3.5 text-white/80" aria-hidden="true" />
                </div>
                <span className="text-[11.5px] leading-tight text-white/80">{card.label}</span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
