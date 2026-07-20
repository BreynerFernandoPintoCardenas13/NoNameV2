import * as React from "react";

/** Círculos/curva y grilla decorativos de fondo, fieles al diseño de referencia. */
export function BackgroundDecor() {
  return (
    <>
      <svg
        className="pointer-events-none absolute -top-[120px] -left-[200px] z-[1] opacity-[0.14] mix-blend-overlay"
        width={900}
        height={900}
        viewBox="0 0 900 900"
        aria-hidden="true"
      >
        <circle cx={450} cy={450} r={440} fill="none" stroke="#ffffff" strokeWidth={1} />
      </svg>
      <svg
        className="pointer-events-none absolute top-[180px] -right-[260px] z-[1] opacity-[0.12] mix-blend-overlay"
        width={700}
        height={700}
        viewBox="0 0 700 700"
        aria-hidden="true"
      >
        <circle cx={350} cy={350} r={340} fill="none" stroke="#ffffff" strokeWidth={1} />
      </svg>
      <svg
        className="pointer-events-none absolute top-[900px] left-1/2 z-[1] -translate-x-1/2 opacity-[0.08] mix-blend-overlay"
        width={1400}
        height={400}
        viewBox="0 0 1400 400"
        aria-hidden="true"
      >
        <path d="M0,380 Q700,-100 1400,380" fill="none" stroke="#ffffff" strokeWidth={1} />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-35 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />
    </>
  );
}
