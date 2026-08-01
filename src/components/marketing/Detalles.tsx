import * as React from "react";

import { BackgroundDecor } from "@/components/landing/BackgroundDecor";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { BenefitsSection } from "@/components/marketing/BenefitsSection";
import { CostSection } from "@/components/marketing/CostSection";
import { CTASection } from "@/components/marketing/CTASection";
import { DashboardSection } from "@/components/marketing/DashboardSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { IntegrationsSection } from "@/components/marketing/IntegrationsSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { ProductivitySection } from "@/components/marketing/ProductivitySection";
import { ROISection } from "@/components/marketing/ROISection";
import { SolutionSection } from "@/components/marketing/SolutionSection";
import { GlobalCursorProvider } from "@/components/shared/global-cursor";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";

/**
 * /detalles — experiencia de venta del producto, construida únicamente con
 * el contenido de PROPUESTA_COMERCIAL.md. Misma identidad visual que la
 * Landing (Navbar, Footer, cursor animado, tipografía, paleta), como una
 * extensión natural de esa página en vez de un microsite aparte.
 */
export function Detalles() {
  return (
    <GlobalCursorProvider>
      <div className={cn(inter.className, "relative min-h-screen overflow-x-hidden bg-[#050505]")}>
        <BackgroundDecor />
        <Navbar />

        <main className="relative z-[2]">
          <HeroSection />
          <ProblemSection />
          <CostSection />
          <SolutionSection />
          <FeaturesSection />
          <DashboardSection />
          <ProductivitySection />
          <IntegrationsSection />
          <BenefitsSection />
          <ROISection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </GlobalCursorProvider>
  );
}
