import * as React from "react";

import { Beams } from "@/components/effects/beams";

/**
 * Fondo del Panel Administrador: mismo componente Beams ya usado en el Hero
 * de la Landing (no se duplica su implementación), fijo detrás del contenido
 * que se desplaza por encima.
 */
export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full bg-black">
      <Beams
        className="fixed inset-0 -z-10"
        beamWidth={3}
        beamHeight={30}
        beamNumber={20}
        lightColor="#ffffff"
        speed={2}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={30}
      />
      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </div>
    </div>
  );
}
