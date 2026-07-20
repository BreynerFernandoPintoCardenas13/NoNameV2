import type { AppUser } from "@/modules/auth/types";
import { PAY_STATUS } from "@/modules/auth/types";

/** Rutas de autenticación centralizadas. */
export const AUTH_ROUTES = {
  LOGIN: "/login",
  VERIFY_EMAIL: "/verificar-email",
  PAYMENT_REQUIRED: "/payment-required",
  DASHBOARD: "/dashboard",
} as const;

/**
 * Regla única de acceso post-login (la usan el proxy y el cliente):
 * sin verificar → /verificar-email; sin pagar → /payment-required; ok → destino.
 */
export function resolvePostLoginRoute(user: AppUser): string {
  if (!user.email_verified) return AUTH_ROUTES.VERIFY_EMAIL;
  if (user.pay !== PAY_STATUS.PAID) return AUTH_ROUTES.PAYMENT_REQUIRED;
  return AUTH_ROUTES.DASHBOARD;
}
