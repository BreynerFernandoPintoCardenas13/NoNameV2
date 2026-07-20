import "server-only";

import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { OpenProjectService } from "@/modules/openproject/services/openproject.service";
import { NO_API_KEY_ERROR, OpenProjectApiError } from "@/modules/openproject/types";

/**
 * Envuelve un handler que necesita hablar con OpenProject como el usuario
 * autenticado: resuelve sesión (401 si no hay), API Key (409 si falta) y
 * traduce `OpenProjectApiError` al mismo contrato que usaba V1
 * (`{ error: "Error de OpenProject", details }` con el status original).
 */
export async function withOpenProject(
  handler: (service: OpenProjectService) => Promise<unknown>,
): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const service = await OpenProjectService.forUser(user.id);
  if (!service) {
    return NextResponse.json(
      { error: NO_API_KEY_ERROR, message: "No hay una API Key de OpenProject configurada." },
      { status: 409 },
    );
  }

  try {
    return NextResponse.json(await handler(service));
  } catch (error) {
    if (error instanceof OpenProjectApiError) {
      return NextResponse.json(
        { error: "Error de OpenProject", details: error.body },
        { status: error.status },
      );
    }
    console.error("Error inesperado hablando con OpenProject:", error);
    return NextResponse.json({ error: "Error inesperado en el servidor" }, { status: 500 });
  }
}
