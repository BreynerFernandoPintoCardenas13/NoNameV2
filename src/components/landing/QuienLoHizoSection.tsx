import Image from "next/image";

import papsito from "@/assets/images/landing/papsito.jpeg";
import quienLoHizoBg from "@/assets/images/landing/quien-lo-hizo-bg.jpg";
import { ElectricBorder } from "@/components/effects/electric-border";
import { Eyebrow } from "@/components/landing/Eyebrow";
import { GlassCard } from "@/components/landing/GlassCard";
import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";
import { Avatar } from "@/components/shared/avatar";

export function QuienLoHizoSection() {
  return (
    <ScrollRevealSection
      id="quien-lo-hizo"
      className="relative z-[2] overflow-hidden px-6 py-28 text-center sm:px-10 sm:py-40"
    >
      <Image src={quienLoHizoBg} alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[#050505]/55" />

      <div className="relative z-[1] mx-auto max-w-2xl">
        <Eyebrow>¿QUIÉN LO HIZO?</Eyebrow>
        <h2 className="mx-auto mt-5 mb-5 text-[clamp(28px,3.6vw,44px)] leading-[1.15] font-medium tracking-[-0.01em] text-[#f7f7f7]">
          Construido por alguien que necesitaba exactamente esto.
        </h2>
        <p className="mx-auto max-w-[520px] text-[15px] leading-[1.7] text-white/70">
          Un proyecto personal, hecho con cuidado y amor, para habilianar la carga, modernizar y que
          ya no tengas que saltarte el almuerzo y trabajar hasta tarde todos los días.
        </p>

        <ElectricBorder
          color="#f7f7f7"
          chaos={0.08}
          speed={0.6}
          borderRadius={24}
          className="mx-auto mt-14 w-fit sm:mt-16"
        >
          <GlassCard className="flex max-w-md items-center gap-5 rounded-3xl p-5 text-left">
            <Avatar
              src={papsito}
              fallback="MF"
              className="size-[84px] shrink-0"
              fallbackClassName="text-lg"
            />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#f7f7f7]">Breyner Pinto</div>
              <div className="mt-0.5 text-[13px] text-white/60">
                Fundador &amp; Desarrollador Junior
              </div>
              <div className="mt-2.5 flex flex-col gap-[3px] text-[12.5px] text-white/65">
                <span>+57 318 2792275</span>
                <span>pintobreyner103@gmail.com</span>
                <a
                  href="https://github.com/BreynerFernandoPintoCardenas13"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/80 transition-colors duration-300 hover:text-white"
                >
                  github.com/BreynerFernandoPintoCardenas13
                </a>
              </div>
            </div>
          </GlassCard>
        </ElectricBorder>
      </div>
    </ScrollRevealSection>
  );
}
