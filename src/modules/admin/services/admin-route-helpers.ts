import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { getAppUserByAuthId } from "@/modules/auth/services/auth.service";
import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { ROLES } from "@/modules/auth/types";
import { adminFiltersSchema } from "@/modules/admin/schemas/admin-filters.schema";
import type { AdminFilters } from "@/modules/admin/types";

/**
 * Envuelve cada Route Handler de `/api/admin/*`: mismo patrón que
 * `modules/openproject/services/route-helpers.ts` (`withOpenProject`),
 * adaptado a rol en vez de API Key. Resuelve, en orden:
 *   1. Sesión (401 si no hay).
 *   2. Rol admin/superadmin (403 si no — nunca se confía en el sidebar).
 *   3. Filtros del querystring, parseados y validados con
 *      `admin-filters.schema.ts` (400 si son inválidos) — "parse → schema →
 *      handler", nunca se leen los params directo en la ruta.
 *   4. Llama al `handler` (que solo debe leer repositories) y responde
 *      `200`; cualquier excepción no controlada cae a `500`.
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (filters: AdminFilters) => Promise<unknown>,
): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const appUser = await getAppUserByAuthId(supabase, user.id);
  const isAdmin = appUser?.role === ROLES.ADMIN || appUser?.role === ROLES.SUPERADMIN;
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = adminFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Filtros inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await handler(parsed.data));
  } catch (error) {
    console.error("Error en un endpoint del Panel Administrador:", error);
    return NextResponse.json({ error: "Error inesperado en el servidor" }, { status: 500 });
  }
}
