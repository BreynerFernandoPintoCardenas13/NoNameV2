"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";

import { PillButton } from "@/components/landing/PillButton";

// "/#hero" en vez de "#hero": desde /detalles (u otra ruta) primero navega a
// la Landing y luego hace scroll al ancla; en "/" se comporta igual que antes.
const NAV_LINKS = [
  { href: "/#hero", label: "Princ." },
  { href: "/#que-hace", label: "¿Qué hace?" },
  { href: "/#quien-lo-hizo", label: "¿Quién lo hizo?" },
  { href: "/detalles", label: "Detalles" },
];

/**
 * Nav fijo: links de anclaje a la Landing + link real a /detalles, centrados,
 * más el botón de login. El login todavía no tiene backend, así que solo
 * deja la navegación preparada. Se reutiliza tal cual en /detalles.
 */
export function Navbar() {
  const router = useRouter();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-center px-6 py-5 sm:px-10">
      <div className="hidden items-center gap-2 sm:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 text-[13px] tracking-[0.01em] text-white/72 transition-colors duration-300 hover:text-white sm:px-10"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <PillButton
        variant="solid"
        className="absolute right-6 px-5 py-2.5 text-[12.5px] sm:right-10"
        aria-label="Iniciar sesión"
        onClick={() => router.push("/login")}
      >
        Logearme
      </PillButton>
    </nav>
  );
}
