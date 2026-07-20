"use client";

import Image from "next/image";

import papsito from "@/assets/images/landing/papsito-removebg-preview.png";
import quienLoHizoBg from "@/assets/images/landing/quien-lo-hizo-bg.jpg";
import { ProfileCard } from "@/components/effects/profile-card";
import { Eyebrow } from "@/components/landing/Eyebrow";
import { ScrollRevealSection } from "@/components/landing/ScrollRevealSection";

const CONTACT_EMAIL = "pintobreyner103@gmail.com";
const GITHUB_URL = "https://github.com/BreynerFernandoPintoCardenas13";

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

        <div className="mx-auto mt-14 w-fit sm:mt-16">
          <ProfileCard
            avatarUrl={papsito}
            name="Breyner Pinto"
            title="Fundador & Desarrollador Junior"
            handle="breynerpinto"
            status="Disponible"
            contactText="Contactar"
            behindGlowEnabled
            behindGlowColor="rgba(247, 247, 247, 0.45)"
            onContactClick={() => {
              window.location.href = `mailto:${CONTACT_EMAIL}`;
            }}
          />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block text-center text-[12.5px] text-white/60 transition-colors duration-300 hover:text-white"
          >
            github.com/BreynerFernandoPintoCardenas13
          </a>
        </div>
      </div>
    </ScrollRevealSection>
  );
}
