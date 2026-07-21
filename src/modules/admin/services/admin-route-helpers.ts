import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { getAppUserByAuthId } from "@/modules/auth/services/auth.service";
import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { ROLES } from "@/modules/auth/types";
import { adminFiltersSchema } from "@/modules/admin/schemas/admin-filters.schema";
import type { AdminFilters } from "@/modules/admin/types";
import { OpenProjectService } from "@/modules/openproject/services/openproject.service";
import { NO_API_KEY_ERROR, OpenProjectApiError } from "@/modules/openproject/types";

/**
 * Envuelve cada Route Handler de `/api/admin/*`: mismo patrón que
 * `modules/openproject/services/route-helpers.ts` (`withOpenProject`),
 * adaptado a rol en vez de solo API Key. Resuelve, en orden:
 *   1. Sesión (401 si no hay).
 *   2. Rol admin/superadmin (403 si no — nunca se confía en el sidebar).
 *   3. Filtros del querystring, parseados y validados con
 *      `admin-filters.schema.ts` (400 si son inválidos) — "parse → schema →
 *      handler", nunca se leen los params directo en la ruta.
 *   4. API Key de OpenProject del propio admin (§2.2, Opción A — 409 si no
 *      tiene una configurada, mismo contrato que `withOpenProject`).
 *   5. Llama al `handler` (que solo debe leer repositories) y responde
 *      `200`; `OpenProjectApiError` se traduce con el status original,
 *      cualquier otra excepción no controlada cae a `500`.
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (filters: AdminFilters, service: OpenProjectService) => Promise<unknown>,
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

  const service = await OpenProjectService.forUser(user.id);
  if (!service) {
    return NextResponse.json(
      { error: NO_API_KEY_ERROR, message: "No hay una API Key de OpenProject configurada." },
      { status: 409 },
    );
  }

  try {
    return NextResponse.json(await handler(parsed.data, service));
  } catch (error) {
    if (error instanceof OpenProjectApiError) {
      return NextResponse.json(
        { error: "Error de OpenProject", details: error.body },
        { status: error.status },
      );
    }
    console.error("Error en un endpoint del Panel Administrador:", error);
    return NextResponse.json({ error: "Error inesperado en el servidor" }, { status: 500 });
  }
}
