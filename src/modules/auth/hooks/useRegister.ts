"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";

import {
  checkEmailVerified,
  saveOpenProjectApiKey,
  signInWithPassword,
  signUpWithEmail,
} from "@/modules/auth/services/auth.service";

/** Intervalo del polling del estado real de verificación en Supabase. */
const VERIFICATION_POLL_MS = 4000;

interface RegisterData {
  username: string;
  email: string;
  /** Solo en memoria durante el flujo; nunca se persiste en el cliente. */
  password: string;
}

/**
 * Orquesta el flujo del stepper de registro:
 * datos → creación de cuenta + correo de confirmación → verificación real → API key.
 */
export function useRegister() {
  const [data, setData] = React.useState<RegisterData>({ username: "", email: "", password: "" });
  const [authId, setAuthId] = React.useState<string | null>(null);
  const [emailVerified, setEmailVerified] = React.useState(false);

  const setUsername = (username: string) => setData((d) => ({ ...d, username }));
  const setCredentials = (email: string, password: string) =>
    setData((d) => ({ ...d, email, password }));

  /** Paso 3: crea la cuenta en Supabase y dispara el correo de confirmación. */
  const signUp = useMutation({
    mutationFn: (input: RegisterData) => signUpWithEmail(input),
    onSuccess: ({ authId: id }) => setAuthId(id),
  });

  // Polling del estado real en Supabase mientras esperamos la confirmación.
  React.useEffect(() => {
    if (!authId || emailVerified) return;

    let cancelled = false;
    const tick = async () => {
      const verified = await checkEmailVerified(authId);
      if (!cancelled && verified) setEmailVerified(true);
    };
    void tick();
    const interval = window.setInterval(tick, VERIFICATION_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [authId, emailVerified]);

  /** Paso 4: inicia sesión (ya verificado) y guarda la API KEY de forma segura. */
  const finish = useMutation({
    mutationFn: async (apiKey: string) => {
      const user = await signInWithPassword(data.email, data.password);
      await saveOpenProjectApiKey(apiKey);
      return user;
    },
  });

  return {
    data,
    setUsername,
    setCredentials,
    signUp,
    accountCreated: authId !== null,
    emailVerified,
    finish,
  };
}
