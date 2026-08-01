"use client";

import * as React from "react";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatCounter } from "@/components/marketing/StatCounter";
import { playfair } from "@/lib/fonts";

const BREAKDOWN = [
  { value: 23809, prefix: "$", suffix: " COP/hora", label: "Costo-hora estimado de un PM" },
  { value: 15, prefix: "", suffix: " h/mes", label: "Horas recuperadas, por PM" },
  { value: 1428540, prefix: "$", suffix: " COP/mes", label: "Con un equipo de 4 PMs" },
] as const;

/** Sección 10 — ROI: cifras del escenario ilustrativo del documento comercial, sin modificar. */
export function ROISection() {
  return (
    <section id="detalles-roi" className="relative bg-[#08080a] px-6 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeading
          eyebrow="RETORNO DE INVERSIÓN"
          title="Un escenario ilustrativo, con números reales de mercado."
          align="center"
          className="mx-auto"
        />

        <div className="mt-14 sm:mt-16">
          <span className="text-[13px] tracking-[0.04em] text-white/50">
            Proyectado a 12 meses, con un equipo de 4 Project Managers
          </span>
          <StatCounter
            value={17142480}
            prefix="≈ $"
            suffix=" COP/año"
            className={`${playfair.className} mt-3 block text-[clamp(40px,7vw,84px)] font-semibold text-[#f7f7f7]`}
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-3">
          {BREAKDOWN.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
            >
              <StatCounter
                value={item.value}
                prefix={item.prefix}
                suffix={item.suffix}
                className={`${playfair.className} block text-[22px] font-semibold text-[#f7f7f7] sm:text-[26px]`}
              />
              <p className="mt-2 text-[12.5px] leading-[1.5] text-white/55">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-[12.5px] leading-[1.65] text-white/40">
          Este cálculo es un <strong className="text-white/60">escenario ilustrativo</strong>,
          construido a partir de datos de mercado colombianos con fuente verificable — no es una
          proyección garantizada de ahorro para su organización. No incluye beneficios adicionales
          más difíciles de cuantificar, como menos retrabajo o decisiones de staffing más rápidas.
          Como referencia internacional de magnitud: estudios de automatización de procesos reportan
          retornos promedio del orden de 240%, con recuperación de la inversión en 6 a 9 meses.
        </p>
      </div>
    </section>
  );
}
