import Image from "next/image";

import queHaceBg from "@/assets/images/landing/que-hace-bg.jpg";
import { Eyebrow } from "@/components/landing/Eyebrow";
import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";

const FEATURES = [
  {
    number: "01",
    title: "Anotación en vivo",
    description:
      "Mientras hablas(aguantas) con los clientes, toma nota y deja que la IA convierta tus palabras en tickets listos en OpenProject.",
  },
  {
    number: "02",
    title: "Guarda Notas y Decisiones",
    description:
      "Registra observaciones, compromisos, avances, reuniones y demas información relevante.",
  },
  {
    number: "03",
    title: "Directorio de proyecto",
    description:
      "Guarda los números y correos de los encargados de cada proyecto, guarda capturas de pantalla, registra información importante, siempre a la mano y vinculada a un proyecto.",
  },
] as const;

export function QueHaceSection() {
  return (
    <ScrollRevealSection
      id="que-hace"
      className="relative z-[2] overflow-hidden px-6 py-32 sm:px-10 sm:py-44 lg:py-52"
    >
      <Image
        src={queHaceBg}
        alt=""
        fill
        sizes="100vw"
        className="object-cover contrast-[1.05] grayscale"
      />
      <div className="absolute inset-0 bg-[#050505]/60" />

      <div className="relative z-[1] mx-auto max-w-5xl">
        <div className="mb-14 sm:mb-16">
          <Eyebrow>¿QUÉ HACE?</Eyebrow>
          <h2 className="mt-5 max-w-3xl text-[clamp(28px,3.6vw,48px)] leading-[1.18] font-medium tracking-[-0.01em] text-[#f7f7f7]">
            Entra a una reunión, y mientras lidias con los clientes toma nota, y deja que la IA
            convierta tus palabras en tickets listos en OpenProject.
          </h2>
        </div>

        <div className="flex flex-wrap gap-10 sm:gap-14">
          {FEATURES.map((feature) => (
            <div
              key={feature.number}
              className="min-w-[240px] flex-1 border-t border-white/[0.18] pt-6"
            >
              <span className="text-xs tracking-[0.05em] text-white/45">{feature.number}</span>
              <h3 className="mt-3.5 mb-2.5 text-[19px] font-semibold text-[#f7f7f7]">
                {feature.title}
              </h3>
              <p className="max-w-[280px] text-[14.5px] leading-[1.6] text-white/65">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollRevealSection>
  );
}
