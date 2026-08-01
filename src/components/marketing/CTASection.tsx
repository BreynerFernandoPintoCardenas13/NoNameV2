"use client";

import { motion } from "motion/react";
import * as React from "react";

import { PillButton } from "@/components/landing/PillButton";
import { playfair } from "@/lib/fonts";

const CONTACT_EMAIL = "pintobreyner103@gmail.com";

/** Sección 11 — CTA: cierre del documento comercial, como invitación final. */
export function CTASection() {
  return (
    <section
      id="detalles-cta"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-28 text-center sm:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-2xl"
      >
        <h2
          className={`${playfair.className} text-[clamp(28px,4.2vw,52px)] leading-[1.12] font-semibold tracking-[-0.01em] text-[#f7f7f7]`}
        >
          La brecha entre documentar y ejecutar — ya la conoce.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[15px] leading-[1.7] text-white/65">
          No venimos a venderle un software. Venimos a mostrarle, con números y con fuentes, el
          tiempo que su equipo podría dedicar a ejecutar en lugar de documentar. La decisión es
          suya.
        </p>

        <div className="mt-10 flex justify-center">
          <PillButton
            variant="solid"
            className="px-7 py-3.5 text-sm"
            onClick={() => {
              window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                "Solicitud de demostración — NoName",
              )}`;
            }}
          >
            Solicitar demostración
          </PillButton>
        </div>
      </motion.div>
    </section>
  );
}
