"use client";

import * as React from "react";

import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { GoogleButton } from "@/modules/auth/components/GoogleButton";
import { LoginForm } from "@/modules/auth/components/LoginForm";
import { RegisterModal } from "@/modules/auth/components/RegisterModal";

/** Card negra central del login, con la identidad visual de la landing. */
export function LoginCard() {
  const [registerOpen, setRegisterOpen] = React.useState(false);

  return (
    <section
      aria-label="Iniciar sesión"
      className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0a0a0a] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] sm:p-10"
    >
      <header className="mb-8 text-center">
        <h1
          className={cn(
            playfair.className,
            "text-3xl font-semibold tracking-[-0.01em] text-[#f7f7f7] uppercase",
          )}
        >
          NoName
        </h1>
        <p className="mt-2 text-[13.5px] text-white/50">Inicia sesión para continuar</p>
      </header>

      <LoginForm />

      <div className="my-6 flex items-center gap-4" role="separator" aria-label="o">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[12px] text-white/40">o</span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <GoogleButton />

      <p className="mt-8 text-center text-[13px] text-white/45">
        ¿No tienes una cuenta?{" "}
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="font-medium text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Registrarme
        </button>
      </p>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} />
    </section>
  );
}
