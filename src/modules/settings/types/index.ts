/** El usuario de OpenProject autenticado por la API Key configurada. */
export interface OpAuthenticatedUser {
  id: number;
  name: string;
  login: string;
}

export interface DefaultResponsible {
  /** Si es `false`, el responsable de los tickets es siempre el usuario autenticado en OpenProject. */
  overrideEnabled: boolean;
  userId: number | null;
  userName: string | null;
}

/** Configuración del usuario tal como la ve la app. La API Key NUNCA aparece aquí. */
export interface UserSettings {
  hasApiKey: boolean;
  opCurrentUser: OpAuthenticatedUser | null;
  defaultResponsible: DefaultResponsible;
}

/** Fila cruda de `user_settings` (sin la API Key: vive en `users`, write-only). */
export interface UserSettingsRow {
  op_current_user_id: number | null;
  op_current_user_name: string | null;
  op_current_user_login: string | null;
  responsible_override_enabled: boolean;
  responsible_user_id: number | null;
  responsible_user_name: string | null;
}

export function rowToSettings(row: UserSettingsRow | null, hasApiKey: boolean): UserSettings {
  return {
    hasApiKey,
    opCurrentUser:
      row?.op_current_user_id != null
        ? {
            id: row.op_current_user_id,
            name: row.op_current_user_name ?? "",
            login: row.op_current_user_login ?? "",
          }
        : null,
    defaultResponsible: {
      overrideEnabled: row?.responsible_override_enabled ?? false,
      userId: row?.responsible_user_id ?? null,
      userName: row?.responsible_user_name ?? null,
    },
  };
}

/**
 * A quién asignar como responsable de un ticket: el override si está activo,
 * si no el usuario autenticado en OpenProject. `null` si no hay ninguno.
 * La IA recibe este valor ya resuelto — nunca lo decide ella (regla de V1).
 */
export function resolveDefaultResponsible(
  settings: UserSettings,
): { id: number; name: string } | null {
  const { defaultResponsible, opCurrentUser } = settings;
  if (defaultResponsible.overrideEnabled) {
    return defaultResponsible.userId !== null && defaultResponsible.userName !== null
      ? { id: defaultResponsible.userId, name: defaultResponsible.userName }
      : null;
  }
  return opCurrentUser ? { id: opCurrentUser.id, name: opCurrentUser.name } : null;
}
