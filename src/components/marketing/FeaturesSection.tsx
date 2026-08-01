"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const Folder = dynamic(() => import("@/components/ui/folder/Folder"), { ssr: false });

function Paper({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-full w-full items-center justify-center p-1.5 text-center text-[8.5px] leading-tight font-medium text-neutral-800">
      {children}
    </span>
  );
}

const CATEGORIES = [
  {
    name: "Gestión de Tickets",
    color: "#f2f2f2",
    items: ["Dictado de reuniones", "Extracción de tickets con IA", "Creación en OpenProject"],
  },
  {
    name: "Gestión de Proyectos",
    color: "#d9d9e3",
    items: ["Base de conocimiento", "Notas con metadatos", "Planeación con responsables"],
  },
  {
    name: "Dashboard Ejecutivo",
    color: "#c9d3e0",
    items: ["Tickets por PM y proyecto", "Ranking de desarrolladores", "Tendencias de carga"],
  },
  {
    name: "Integración OpenProject",
    color: "#d6cfe8",
    items: ["API v3 nativa", "Token por usuario", "Potencia, no reemplaza"],
  },
  {
    name: "Inteligencia Operativa",
    color: "#cfe0dc",
    items: ["Motor Claude (Anthropic)", "Automatización end-to-end", "Seguridad y RLS"],
  },
] as const;

/** Sección 5 — Funcionalidades: una carpeta interactiva por categoría (componente Folder). */
export function FeaturesSection() {
  return (
    <ScrollRevealSection
      id="detalles-funcionalidades"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="FUNCIONALIDADES"
          title="Cada categoría, a un clic de abrirse."
          description="Abre cada carpeta para ver las funcionalidades que la componen."
          align="center"
          className="mx-auto"
        />

        <div className="mt-20 grid grid-cols-1 place-items-center gap-x-6 gap-y-24 sm:mt-24 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <div key={category.name} className="flex flex-col items-center gap-6">
              <Folder
                size={1.4}
                color={category.color}
                items={category.items.map((item) => (
                  <Paper key={item}>{item}</Paper>
                ))}
              />
              <span className="text-[13px] font-medium tracking-[0.01em] text-white/75">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
