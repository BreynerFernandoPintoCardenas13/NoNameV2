import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";
import type { AppUser } from "@/modules/auth/types";

/**
 * Servicio central de autenticación. TODA la comunicación con Supabase Auth
 * pasa por aquí: los componentes nunca llaman al SDK directamente.
 */

/** Columnas seguras de `users`. openproject_api_key queda excluida SIEMPRE. */
const APP_USER_COLUMNS =
  "id, auth_id, username, email, role, pay, email_verified, active, created_at, updated_at";

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

function toFriendlyMessage(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("email not confirmed")) return "Tu correo aún no está verificado.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (msg.includes("already registered")) return "Ese correo ya está registrado.";
  return "Ocurrió un error. Inténtalo de nuevo.";
}

/**
 * Lee la fila pública del usuario. Reutilizable con cualquier cliente
 * (browser, server o proxy) para no duplicar la consulta.
 */
export async function getAppUserByAuthId(
  supabase: SupabaseClient,
  authId: string,
): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select(APP_USER_COLUMNS)
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) return null;
  return data as AppUser | null;
}

/** Usuario de la sesión actual (o null si no hay sesión). */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getAppUserByAuthId(supabase, user.id);
}

/** Login con correo y contraseña. Devuelve la fila pública del usuario. */
export async function signInWithPassword(email: string, password: string): Promise<AppUser> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AuthServiceError(toFriendlyMessage(error.message));

  const appUser = await getAppUserByAuthId(supabase, data.user.id);
  if (!appUser) throw new AuthServiceError("No se encontró tu perfil. Contacta al administrador.");
  return appUser;
}

/** Login con Google (OAuth oficial de Supabase). Redirige al proveedor. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new AuthServiceError(toFriendlyMessage(error.message));
}

/**
 * Crea la cuenta (paso 3 del registro) y dispara el correo de confirmación.
 * El username viaja en metadata: el trigger de la base de datos crea la fila
 * pública en `users`. Devuelve el id de auth para consultar la verificación.
 */
export async function signUpWithEmail(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ authId: string }> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { username: input.username },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new AuthServiceError(toFriendlyMessage(error.message));

  // Supabase devuelve "éxito" con identities vacías cuando el correo ya existe.
  if (!data.user || data.user.identities?.length === 0) {
    throw new AuthServiceError("Ese correo ya está registrado. Inicia sesión.");
  }
  return { authId: data.user.id };
}

/**
 * Consulta el estado REAL de verificación en Supabase a través del servidor
 * (la service role nunca toca el navegador). No simula nada.
 */
export async function checkEmailVerified(authId: string): Promise<boolean> {
  const res = await fetch("/api/auth/verification-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authId }),
  });
  if (!res.ok) return false;
  const body = (await res.json()) as { verified?: boolean };
  return body.verified === true;
}

/** Reenvía el correo de confirmación. */
export async function resendVerificationEmail(email: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw new AuthServiceError(toFriendlyMessage(error.message));
}

/**
 * Guarda la API KEY de OpenProject en la fila del propio usuario.
 * La base de datos solo permite ESCRIBIR esta columna (SELECT revocado):
 * la key viaja una única vez por TLS y nunca puede volver al cliente.
 * No se loguea, no se devuelve, no se guarda en estado global.
 */
export async function saveOpenProjectApiKey(apiKey: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthServiceError("Sesión no válida. Inicia sesión de nuevo.");

  const { error } = await supabase
    .from("users")
    .update({ openproject_api_key: apiKey })
    .eq("auth_id", user.id);

  if (error) throw new AuthServiceError("No se pudo guardar la API KEY. Inténtalo de nuevo.");
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}
