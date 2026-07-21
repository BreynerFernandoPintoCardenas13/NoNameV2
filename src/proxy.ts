import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env.public";
import { getAppUserByAuthId } from "@/modules/auth/services/auth.service";
import { AUTH_ROUTES, resolvePostLoginRoute } from "@/modules/auth/utils/auth-redirect";

/**
 * Protección central de rutas (Next 16: proxy, antes middleware).
 * Reglas: sin sesión → /login · sin verificar → /verificar-email ·
 * sin pagar → /payment-required · todo correcto → /dashboard.
 */

const PROTECTED_PREFIXES = ["/dashboard"];
const GATE_ROUTES: string[] = [AUTH_ROUTES.VERIFY_EMAIL, AUTH_ROUTES.PAYMENT_REQUIRED];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valida el JWT contra Supabase (no confiar solo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isGate = GATE_ROUTES.includes(pathname);
  const isLogin = pathname === AUTH_ROUTES.LOGIN;

  const redirectTo = (route: string) => {
    const url = request.nextUrl.clone();
    url.pathname = route;
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (!user) {
    if (isProtected || isGate) return redirectTo(AUTH_ROUTES.LOGIN);
    return response;
  }

  const appUser = await getAppUserByAuthId(supabase, user.id);
  if (!appUser) {
    // Sesión válida sin fila pública (caso anómalo): solo se permite /login.
    if (isProtected || isGate) return redirectTo(AUTH_ROUTES.LOGIN);
    return response;
  }

  const allowedRoute = resolvePostLoginRoute(appUser);

  // Con sesión activa, /login y las pantallas intermedias ya superadas
  // redirigen al único destino permitido por el estado del usuario.
  if (isLogin || ((isProtected || isGate) && pathname !== allowedRoute)) {
    if (!pathname.startsWith(allowedRoute)) return redirectTo(allowedRoute);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/verificar-email", "/payment-required"],
};
