/** Roles permitidos en el sistema. Única fuente de verdad: no usar strings sueltos. */
export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Estado de pago (columna `pay`). */
export const PAY_STATUS = {
  UNPAID: 0,
  PAID: 1,
} as const;

export type PayStatus = (typeof PAY_STATUS)[keyof typeof PAY_STATUS];

/**
 * Fila pública de `users` visible para el propio usuario.
 * `openproject_api_key` NO existe aquí a propósito: la columna tiene el
 * privilegio SELECT revocado en la base de datos y jamás viaja al cliente.
 */
export interface AppUser {
  id: string;
  auth_id: string;
  username: string;
  email: string;
  role: UserRole;
  pay: PayStatus;
  email_verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}
