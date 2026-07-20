import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";
import {
  rowToSettings,
  type OpAuthenticatedUser,
  type UserSettings,
  type UserSettingsRow,
} from "@/modules/settings/types";

/**
 * Configuración del usuario. La fila `user_settings` se lee/escribe directo
 * con RLS; `hasApiKey` y el guardado de la key pasan por el route handler
 * (la columna es write-only para el cliente).
 */

const SETTINGS_COLUMNS =
  "op_current_user_id, op_current_user_name, op_current_user_login, responsible_override_enabled, responsible_user_id, responsible_user_name";

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = getSupabaseBrowserClient();

  const [settingsResult, apiKeyResult] = await Promise.all([
    supabase.from("user_settings").select(SETTINGS_COLUMNS).maybeSingle(),
    fetch("/api/settings/api-key").then((res) => (res.ok ? res.json() : { hasApiKey: false })),
  ]);

  if (settingsResult.error) {
    console.error("No se pudo cargar la configuración:", settingsResult.error);
    throw new Error(`No se pudo cargar la configuración (${settingsResult.error.message}).`);
  }
  return rowToSettings(
    settingsResult.data as UserSettingsRow | null,
    Boolean((apiKeyResult as { hasApiKey?: boolean }).hasApiKey),
  );
}

export interface SaveApiKeyResult {
  hasApiKey: boolean;
  opCurrentUser: OpAuthenticatedUser | null;
  warning?: string;
}

/** Envía la key al servidor (única vez, TLS). Jamás se guarda en estado del cliente. */
export async function saveApiKey(apiKey: string): Promise<SaveApiKeyResult> {
  const res = await fetch("/api/settings/api-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? "No se pudo guardar la API Key.");
  return body as SaveApiKeyResult;
}

/** Activa/desactiva el override de "Responsable" y, si se activa, fija a quién. */
export async function setDefaultResponsible(input: {
  overrideEnabled: boolean;
  userId?: number;
  userName?: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión no válida.");

  const { error } = await supabase.from("user_settings").upsert(
    {
      auth_id: user.id,
      responsible_override_enabled: input.overrideEnabled,
      responsible_user_id: input.overrideEnabled ? (input.userId ?? null) : null,
      responsible_user_name: input.overrideEnabled ? (input.userName ?? null) : null,
    },
    { onConflict: "auth_id" },
  );
  if (error) throw new Error("No se pudo guardar el responsable por defecto.");
}
