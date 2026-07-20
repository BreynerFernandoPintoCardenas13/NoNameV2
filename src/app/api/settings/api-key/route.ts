import { NextResponse } from "next/server";
import { z } from "zod";

import { apiKeySchema } from "@/modules/auth/schemas/auth.schemas";
import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { OpenProjectService } from "@/modules/openproject/services/openproject.service";

/**
 * API Key de OpenProject del usuario. La key viaja UNA vez (POST, TLS) y se
 * guarda en `users.openproject_api_key` (columna write-only para el cliente).
 * Nunca se devuelve ni se loguea. GET solo responde si existe.
 */

const bodySchema = z.object({ apiKey: apiKeySchema });

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  // El propio usuario no puede SELECT-ear su key (privilegio revocado); un
  // RPC sería más elegante, pero un head-count con la service role es lo
  // mínimo. Se usa el service de OpenProject como única puerta a la key.
  const service = await OpenProjectService.forUser(user.id);
  return NextResponse.json({ hasApiKey: service !== null });
}

/**
 * Guarda la API Key y, de inmediato, resuelve quién es su dueño contra
 * OpenProject (`/users/me`). Si la key no es válida, igual se guarda (es lo
 * que el usuario pidió guardar), pero se responde con un aviso — misma
 * semántica que V1.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "apiKey es obligatorio y debe ser válida." },
      { status: 400 },
    );
  }
  const { apiKey } = parsed.data;

  // Con el JWT del usuario: el grant de columna + RLS permiten actualizar
  // SOLO la propia key. La service role no hace falta para escribir.
  const { error: saveError } = await supabase
    .from("users")
    .update({ openproject_api_key: apiKey })
    .eq("auth_id", user.id);
  if (saveError) {
    return NextResponse.json({ error: "No se pudo guardar la API Key." }, { status: 500 });
  }

  try {
    const opUser = await OpenProjectService.withApiKey(apiKey).getCurrentUser();
    // Una key nueva pertenece (probablemente) a otro usuario de OpenProject:
    // se reemplaza el perfil resuelto.
    const { error: settingsError } = await supabase.from("user_settings").upsert(
      {
        auth_id: user.id,
        op_current_user_id: opUser.id,
        op_current_user_name: opUser.name,
        op_current_user_login: opUser.login,
      },
      { onConflict: "auth_id" },
    );
    if (settingsError) throw new Error("No se pudo guardar el perfil de OpenProject.");

    return NextResponse.json({
      hasApiKey: true,
      opCurrentUser: { id: opUser.id, name: opUser.name, login: opUser.login },
    });
  } catch {
    // La key quedó guardada pero no se pudo verificar: perfil anterior ya no es válido.
    await supabase.from("user_settings").upsert(
      {
        auth_id: user.id,
        op_current_user_id: null,
        op_current_user_name: null,
        op_current_user_login: null,
      },
      { onConflict: "auth_id" },
    );
    return NextResponse.json({
      hasApiKey: true,
      opCurrentUser: null,
      warning:
        "La API Key se guardó, pero no se pudo verificar contra OpenProject (credenciales inválidas o servidor inaccesible).",
    });
  }
}
