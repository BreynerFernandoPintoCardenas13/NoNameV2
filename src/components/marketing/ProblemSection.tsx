"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { AlertTriangle, History, Inbox, Keyboard, MessageSquareOff, MoonStar } from "lucide-react";

import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatCounter } from "@/components/marketing/StatCounter";
import { playfair } from "@/lib/fonts";

const ColorBends = dynamic(() => import("@/components/ui/color-bends/ColorBends"), {
  ssr: false,
});

const PAIN_POINTS = [
  {
    icon: MessageSquareOff,
    title: "Reuniones sin registro claro",
    description: "Terminan sin que quede constancia real de lo que se decidió.",
  },
  {
    icon: Keyboard,
    title: "Transcripción manual",
    description: "Horas de un PM redactando tickets uno por uno después de cada reunión.",
  },
  {
    icon: Inbox,
    title: "Tareas perdidas",
    description: "Se diluyen entre chats, correos y documentos sueltos.",
  },
  {
    icon: AlertTriangle,
    title: "Instrucciones incompletas",
    description: 'Desarrolladores que deben parar a preguntar "¿esto qué significa exactamente?".',
  },
  {
    icon: History,
    title: "Cero trazabilidad",
    description: "No hay registro claro de qué cambió, cuándo, ni por qué.",
  },
  {
    icon: MoonStar,
    title: "Reportes de última hora",
    description: "Armados a mano, la noche antes del comité de gerencia.",
  },
] as const;

const STATS = [
  { value: 48, suffix: "%", label: "de los proyectos no se completa a tiempo" },
  { value: 43, suffix: "%", label: "supera el presupuesto asignado" },
  { value: 11.4, decimals: 1, suffix: "%", label: "de la inversión se pierde por mala gestión" },
  { value: 4.5, decimals: 1, suffix: "h/semana", label: "solo buscando información y documentos" },
] as const;

/** Sección 2 — El problema: fondo ColorBends + cards de dolor + contadores de mercado. */
export function ProblemSection() {
  return (
    <ScrollRevealSection
      id="detalles-problema"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="absolute inset-0 opacity-[0.22]">
        <ColorBends
          colors={["#3a3a3a", "#8a8a8a", "#f7f7f7"]}
          rotation={110}
          speed={0.12}
          scale={1.4}
          frequency={0.8}
          warpStrength={0.8}
          mouseInfluence={0.6}
          noise={0.1}
          intensity={1.1}
          bandWidth={5}
        />
      </div>
      <div className="absolute inset-0 bg-[#050505]/70" />

      <div className="relative z-[1] mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="EL PROBLEMA"
          title="Lo que ya conoce, pero rara vez se mide."
          description="Todo gerente que ha liderado equipos de proyectos reconoce este patrón."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {PAIN_POINTS.map((point, i) => (
            <div
              key={point.title}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl duration-700"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <point.icon className="size-5 text-white/70" aria-hidden="true" />
              <h3 className="mt-4 text-[15px] font-semibold text-[#f7f7f7]">{point.title}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">{point.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 border-t border-white/[0.12] pt-10 sm:mt-20 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <StatCounter
                value={stat.value}
                suffix={stat.suffix}
                decimals={"decimals" in stat ? stat.decimals : 0}
                className={`${playfair.className} block text-[clamp(26px,3vw,38px)] font-semibold text-[#f7f7f7]`}
              />
              <p className="mt-1.5 text-[12.5px] leading-[1.5] text-white/55">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
