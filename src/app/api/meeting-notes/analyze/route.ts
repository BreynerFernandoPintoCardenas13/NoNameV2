import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { MeetingAIService } from "@/modules/ai/services/meeting-ai.service";
import {
  loadMeetingDocument,
  prepareForAI,
} from "@/modules/notes/services/meeting-document.service";
import {
  rowToSettings,
  resolveDefaultResponsible,
  type UserSettingsRow,
} from "@/modules/settings/types";
import { toPublicTicketDraft } from "@/modules/tickets/utils/public-draft";

/**
 * PASO "CREAR TICKETS" (1/2): la IA analiza el documento y propone tickets,
 * pero todavía NO se crea nada en OpenProject — eso espera la confirmación
 * del PM (`POST /api/meeting-notes/create-tickets`). La propuesta se
 * persiste en `ticket_analyses` (en V1 era un Map en memoria: no sobrevivía
 * reinicios ni funciona en serverless).
 *
 * Si tras filtrar bloques Frozen/vacíos no queda nada, responde
 * `{ noPendingContent: true }` sin llamar a la IA (sin gastar tokens).
 */

const bodySchema = z.object({
  projectId: z.uuid(),
  noteId: z.uuid(),
  document: z.unknown(),
});

// Rate limit por usuario: analizar llama a Claude (dinero real).
const WINDOW_MS = 60_000;
const MAX_ANALYSES_PER_WINDOW = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = hits.get(userId);
  if (!entry || now > entry.resetAt) {
    hits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ANALYSES_PER_WINDOW;
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Demasiados análisis seguidos. Espera un minuto." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "projectId, noteId y document son obligatorios." },
      { status: 400 },
    );
  }

  // RLS garantiza que el proyecto es del usuario (si no, no aparece).
  const { data: project } = await supabase
    .from("projects")
    .select("id, openproject_name")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "El proyecto no existe." }, { status: 404 });
  }

  let document;
  try {
    document = loadMeetingDocument(parsed.data.document);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const prepared = prepareForAI(document);
  if (!prepared.content || prepared.content.length === 0) {
    return NextResponse.json({ noPendingContent: true });
  }

  // Responsable ya resuelto por la configuración — la IA nunca lo decide.
  const { data: settingsRow } = await supabase
    .from("user_settings")
    .select(
      "op_current_user_id, op_current_user_name, op_current_user_login, responsible_override_enabled, responsible_user_id, responsible_user_name",
    )
    .maybeSingle();
  const responsible = resolveDefaultResponsible(
    rowToSettings((settingsRow as UserSettingsRow | null) ?? null, true),
  );

  try {
    const drafts = await new MeetingAIService().analyzeMeetingNotes(
      prepared,
      { projectName: project.openproject_name as string },
      responsible,
    );

    const { data: analysis, error: insertError } = await supabase
      .from("ticket_analyses")
      .insert({ note_id: parsed.data.noteId, project_id: project.id, drafts })
      .select("id")
      .single();
    if (insertError) throw new Error("No se pudo guardar la propuesta de tickets.");

    return NextResponse.json({
      analysisId: analysis.id,
      ticketDrafts: drafts.map((draft) =>
        toPublicTicketDraft(draft, project.openproject_name as string),
      ),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
