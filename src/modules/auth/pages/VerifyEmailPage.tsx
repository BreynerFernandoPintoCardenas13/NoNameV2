"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AuthBackground } from "@/modules/auth/components/AuthBackground";
import { SignOutButton } from "@/modules/auth/components/SignOutButton";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { resendVerificationEmail } from "@/modules/auth/services/auth.service";
import { resolvePostLoginRoute } from "@/modules/auth/utils/auth-redirect";

export function VerifyEmailPage() {
  const router = useRouter();
  const { data: user, isLoading, refetch } = useCurrentUser();
  const [resending, setResending] = React.useState(false);

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    try {
      await resendVerificationEmail(user.email);
      toast.success("Correo de verificación reenviado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reenviar el correo.");
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    const { data: fresh } = await refetch();
    if (fresh?.email_verified) {
      router.replace(resolvePostLoginRoute(fresh));
    } else {
      toast.info("Aún no vemos la verificación. Revisa tu bandeja de entrada.");
    }
  };

  return (
    <AuthBackground>
      <section aria-label="Verificar correo" className="max-w-lg text-center">
        <MailCheck className="mx-auto size-9 text-white/60" aria-hidden="true" />
        <h1
          className={cn(
            playfair.className,
            "mt-5 text-[clamp(28px,4.5vw,44px)] leading-[1.1] font-semibold tracking-[-0.01em] text-[#f7f7f7]",
          )}
        >
          Verifica tu correo
        </h1>
        {isLoading ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-[14px] text-white/50">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando…
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-sm text-[14.5px] leading-relaxed text-white/55">
            Enviamos un enlace de confirmación a{" "}
            <span className="text-white/85">{user?.email ?? "tu correo"}</span>. Haz clic en él para
            continuar.
          </p>
        )}
        <div className="mt-9 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleCheck}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-all duration-300 hover:-translate-y-px hover:opacity-[0.85]"
          >
            Ya verifiqué mi correo
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !user}
            className="inline-flex items-center gap-2 text-[13px] text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-60"
          >
            {resending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            Reenviar correo
          </button>
          <SignOutButton />
        </div>
      </section>
    </AuthBackground>
  );
}
