"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { CURRENT_USER_QUERY_KEY } from "@/modules/auth/hooks/useCurrentUser";
import { signInWithGoogle, signInWithPassword } from "@/modules/auth/services/auth.service";
import type { LoginInput } from "@/modules/auth/schemas/auth.schemas";
import { resolvePostLoginRoute } from "@/modules/auth/utils/auth-redirect";

/** Login con contraseña (redirige según verificación/pago) y login con Google. */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const passwordLogin = useMutation({
    mutationFn: ({ email, password }: LoginInput) => signInWithPassword(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      router.replace(resolvePostLoginRoute(user));
    },
  });

  const googleLogin = useMutation({
    // Redirige al proveedor: el callback /auth/callback completa el flujo.
    mutationFn: signInWithGoogle,
  });

  return { passwordLogin, googleLogin };
}
