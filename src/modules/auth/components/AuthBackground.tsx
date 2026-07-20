import * as React from "react";

import { BackgroundDecor } from "@/components/landing/BackgroundDecor";

const NOISE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * Fondo de las páginas de auth: misma identidad que la Landing
 * (gradiente negro → gris → blanco, líneas suaves, glow tenue, ruido sutil).
 * Sin imágenes: todo es CSS/SVG.
 */
export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#050505_0%,#0a0a0a_30%,#1c1c1c_62%,#4a4a48_86%,#b8b6b0_100%)]">
      <BackgroundDecor />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute top-[-20%] left-[-15%] h-[70%] w-[70%] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute right-[-20%] bottom-[-15%] h-[65%] w-[65%] rounded-full blur-[150px]"
          style={{
            background: "radial-gradient(circle, rgba(210,212,224,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: `url("${NOISE_URL}")`, backgroundSize: "180px 180px" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      <main className="relative z-[2] flex min-h-screen items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
