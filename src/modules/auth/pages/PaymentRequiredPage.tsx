import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AuthBackground } from "@/modules/auth/components/AuthBackground";
import { SignOutButton } from "@/modules/auth/components/SignOutButton";

const ADMIN_EMAIL = "pintobreyner103@gmail.com";

export function PaymentRequiredPage() {
  return (
    <AuthBackground>
      <section aria-label="Pago requerido" className="max-w-xl text-center">
        <h1
          className={cn(
            playfair.className,
            "text-[clamp(34px,6vw,64px)] leading-[1.05] font-semibold tracking-[-0.01em] text-[#f7f7f7]",
          )}
        >
          No se ha realizado el pago.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[14.5px] leading-relaxed text-white/55">
          Tu cuenta está creada pero aún no tiene acceso. Contacta al administrador para activar tu
          suscripción.
        </p>
        <div className="mt-10 flex flex-col items-center gap-5">
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=Activación de cuenta NoName`}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-all duration-300 hover:-translate-y-px hover:opacity-[0.85]"
          >
            Contactar administrador
          </a>
          <SignOutButton />
        </div>
      </section>
    </AuthBackground>
  );
}
