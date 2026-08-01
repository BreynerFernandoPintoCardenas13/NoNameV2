"use client";

import * as React from "react";
import { Atom, Boxes, Database, FileCode, Layers, Triangle, Wind } from "lucide-react";

import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const INTEGRATIONS = [
  {
    icon: Boxes,
    name: "OpenProject",
    description: "Se conecta a su instancia vía API v3, sin reemplazarla — la potencia.",
  },
  {
    icon: Database,
    name: "Supabase",
    description: "Autenticación gestionada y aislamiento de datos por organización (RLS).",
  },
  {
    icon: Layers,
    name: "Next.js",
    description: "Arquitectura moderna sobre Next.js 16, validación estricta desde el arranque.",
  },
  {
    icon: Atom,
    name: "React",
    description: "React 19 en el núcleo de toda la interfaz.",
  },
  {
    icon: FileCode,
    name: "TypeScript",
    description: "Tipado estricto de extremo a extremo.",
  },
  {
    icon: Wind,
    name: "Tailwind CSS",
    description: "Sistema visual consistente en toda la aplicación.",
  },
  {
    icon: Triangle,
    name: "Vercel",
    description: "Despliegue e infraestructura de borde.",
  },
] as const;

/** Sección 8 — Integraciones: stack real, con descripción breve al hover. */
export function IntegrationsSection() {
  return (
    <ScrollRevealSection
      id="detalles-integraciones"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="INTEGRACIONES"
          title="Construido sobre herramientas en las que ya confía."
          align="center"
          className="mx-auto"
        />

        <div className="mt-14 grid grid-cols-2 gap-4 sm:mt-16 sm:grid-cols-3 lg:grid-cols-4">
          {INTEGRATIONS.map((tech) => (
            <div
              key={tech.name}
              tabIndex={0}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.08] focus-visible:border-white/40 focus-visible:outline-none"
            >
              <tech.icon
                className="mx-auto size-6 text-white/70 transition-transform duration-300 group-hover:scale-110 group-hover:text-white"
                aria-hidden="true"
              />
              <span className="mt-3 block text-[13px] font-medium text-[#f7f7f7]">{tech.name}</span>
              <p className="mt-2 line-clamp-3 text-[11.5px] leading-[1.5] text-white/0 transition-colors duration-300 group-hover:text-white/60 group-focus-visible:text-white/60">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
