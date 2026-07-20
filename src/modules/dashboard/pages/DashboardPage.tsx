import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AuthBackground } from "@/modules/auth/components/AuthBackground";
import { SignOutButton } from "@/modules/auth/components/SignOutButton";

/** Dashboard temporal: solo el saludo mientras se construye el resto del sistema. */
export function DashboardPage() {
  return (
    <AuthBackground>
      <section aria-label="Dashboard" className="text-center">
        <h1
          className={cn(
            playfair.className,
            "text-[clamp(32px,5vw,56px)] font-semibold tracking-[-0.01em] text-[#f7f7f7]",
          )}
        >
          Bienvenido a NoName
        </h1>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </section>
    </AuthBackground>
  );
}
