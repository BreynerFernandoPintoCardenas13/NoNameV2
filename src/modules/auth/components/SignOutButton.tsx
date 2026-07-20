"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { signOut } from "@/modules/auth/services/auth.service";
import { AUTH_ROUTES } from "@/modules/auth/utils/auth-redirect";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const handleClick = async () => {
    setPending(true);
    await signOut();
    router.replace(AUTH_ROUTES.LOGIN);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        className ??
        "text-[13px] text-white/45 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-60"
      }
    >
      Cerrar sesión
    </button>
  );
}
