"use client";

import { Loader2 } from "lucide-react";

import { useLogin } from "@/modules/auth/hooks/useLogin";

/** OAuth oficial de Supabase: redirige a Google y vuelve por /auth/callback. */
export function GoogleButton() {
  const { googleLogin } = useLogin();

  return (
    <button
      type="button"
      onClick={() => googleLogin.mutate()}
      disabled={googleLogin.isPending}
      className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-full border border-white/[0.18] bg-white/[0.06] text-sm font-medium text-[#f7f7f7] backdrop-blur-md transition-all duration-300 hover:bg-white/[0.12] disabled:pointer-events-none disabled:opacity-60"
    >
      {googleLogin.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
          <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
        </svg>
      )}
      Continuar con Google
      {googleLogin.isError && <span className="sr-only">Error al iniciar con Google</span>}
    </button>
  );
}
