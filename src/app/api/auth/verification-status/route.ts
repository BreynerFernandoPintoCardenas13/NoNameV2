import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { authServerEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.public";
import { verificationStatusSchema } from "@/modules/auth/schemas/auth.schemas";

/**
 * Estado REAL de verificación de correo, consultado con la service role
 * (solo servidor). Respuesta mínima ({ verified }) para no filtrar nada más.
 */

// Rate limit simple en memoria por IP (suficiente para el polling del registro).
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  // Mitigación CSRF: solo aceptar peticiones del propio origen.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ verified: false }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(ip)) {
    return NextResponse.json({ verified: false }, { status: 429 });
  }

  const parsed = verificationStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const admin = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    authServerEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await admin.auth.admin.getUserById(parsed.data.authId);
  if (error || !data.user) {
    return NextResponse.json({ verified: false });
  }

  return NextResponse.json({ verified: data.user.email_confirmed_at != null });
}
