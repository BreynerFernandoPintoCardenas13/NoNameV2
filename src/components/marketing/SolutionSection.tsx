"use client";

import * as React from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Database,
  MessagesSquare,
  Timer,
  Zap,
} from "lucide-react";

import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const CHANGES = [
  {
    icon: Database,
    title: "Centraliza información",
    description: "La que hoy vive dispersa entre notas, chats y memoria de las personas.",
  },
  {
    icon: Zap,
    title: "Elimina tareas repetitivas",
    description: "Transcripción y redacción manual de tickets, fuera del día a día del PM.",
  },
  {
    icon: MessagesSquare,
    title: "Mejora la comunicación",
    description: "Entre quien decide la reunión y quien ejecuta el desarrollo.",
  },
  {
    icon: Timer,
    title: "Reduce tiempos administrativos",
    description: "Que hoy recaen sobre roles que deberían estar liderando, no digitando.",
  },
  {
    icon: CalendarCheck,
    title: "Mejora la planeación",
    description: "Estimaciones y responsables definidos desde el primer momento.",
  },
  {
    icon: Activity,
    title: "Facilita el seguimiento",
    description: "Sin depender de que alguien arme un Excel manualmente.",
  },
  {
    icon: BarChart3,
    title: "Métricas reales",
    description: "En vivo, sin esperar a que alguien las consolide.",
  },
  {
    icon: BookOpen,
    title: "Preserva el conocimiento",
    description: "Credenciales, decisiones y contexto, más allá de una sola persona.",
  },
] as const;

/** Sección 4 — ¿Qué cambia con NoName?: la solución, en cards cortas. */
export function SolutionSection() {
  return (
    <ScrollRevealSection id="detalles-solucion" className="relative px-6 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="LA SOLUCIÓN"
          title="¿Qué cambia con NoName?"
          description="No es una lista de funciones. Es una respuesta a necesidades concretas que hoy consumen tiempo de gerencia y de operación."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {CHANGES.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.07]"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-white/[0.08] transition-transform duration-300 group-hover:scale-110">
                <item.icon className="size-4 text-white/80" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-[14.5px] font-semibold text-[#f7f7f7]">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-white/60">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
