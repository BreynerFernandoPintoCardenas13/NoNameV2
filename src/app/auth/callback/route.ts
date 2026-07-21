import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getAppUserByAuthId } from "@/modules/auth/services/auth.service";
import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { AUTH_ROUTES, resolvePostLoginRoute } from "@/modules/auth/utils/auth-redirect";

/**
 * Callback de autenticación: intercambia el código PKCE (OAuth Google) o el
 * token de confirmación de correo, y redirige según el estado del usuario.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await getSupabaseServerClient();
  const loginUrl = new URL(AUTH_ROUTES.LOGIN, origin);

  let authId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) authId = data.user?.id ?? null;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) authId = data.user?.id ?? null;
  }

  if (!authId) return NextResponse.redirect(loginUrl);

  const appUser = await getAppUserByAuthId(supabase, authId);
  if (!appUser) return NextResponse.redirect(loginUrl);

  return NextResponse.redirect(new URL(resolvePostLoginRoute(appUser), origin));
}
