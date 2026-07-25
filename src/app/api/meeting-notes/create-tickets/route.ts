import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import {
  applyTicketTracking,
  loadMeetingDocument,
} from "@/modules/notes/services/meeting-document.service";
import type { TicketTracking } from "@/modules/notes/types";
import { OpenProjectService } from "@/modules/openproject/services/openproject.service";
import { NO_API_KEY_ERROR, OpenProjectApiError } from "@/modules/openproject/types";
import { materializeDrafts } from "@/modules/tickets/services/draft-images.server";
import type { StoredTicketDraft } from "@/modules/tickets/types";

/**
 * PASO "CREAR TICKETS" (2/2): confirmación del PM tras revisar la propuesta.
 * Recorre los drafts ya generados (sin volver a preguntarle nada a la IA) y
 * los crea de verdad en OpenProject. Tras crearlos, congela (Frozen) los
 * bloques de origen en la nota persistida y devuelve el documento
 * actualizado para que el editor refresque los indicadores sin recargar.
 */

const bodySchema = z.object({ analysisId: z.uuid() });

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "analysisId es obligatorio." }, { status: 400 });
  }

  const { data: analysis } = await supabase
    .from("ticket_analyses")
    .select("id, note_id, project_id, drafts, status, expires_at")
    .eq("id", parsed.data.analysisId)
    .maybeSingle();

  if (!analysis || analysis.status !== "pending" || new Date(analysis.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Esta propuesta de tickets ya no está disponible. Vuelve a generarla." },
      { status: 404 },
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, openproject_id, board_list_id")
    .eq("id", analysis.project_id)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "El proyecto no existe." }, { status: 404 });
  }

  const service = await OpenProjectService.forUser(user.id);
  if (!service) {
    return NextResponse.json(
      { error: NO_API_KEY_ERROR, message: "No hay una API Key de OpenProject configurada." },
      { status: 409 },
    );
  }

  try {
    const storedDrafts = analysis.drafts as StoredTicketDraft[];
    const drafts = await materializeDrafts(storedDrafts);

    const created = await service.createTicketsFromDrafts(
      String(project.openproject_id),
      drafts,
      (project.board_list_id as number | null) ?? undefined,
    );

    await supabase.from("ticket_analyses").update({ status: "confirmed" }).eq("id", analysis.id);

    // Congelar los bloques de origen en la nota persistida.
    const { data: note } = await supabase
      .from("notes")
      .select("id, document")
      .eq("id", analysis.note_id)
      .maybeSingle();

    let updatedDocument: unknown = note?.document;
    if (note) {
      const trackingByBlockIndex = new Map<number, TicketTracking>();
      storedDrafts.forEach((draft, i) => {
        const workPackage = created[i];
        const tracking: TicketTracking = {
          ticketId: draft.ticketId,
          status: "frozen",
          workPackageId: workPackage.id,
          workPackageUrl: service.buildWorkPackageUrl(workPackage),
          createdAt: new Date().toISOString(),
        };
        for (const blockIndex of draft.sourceBlockIndices) {
          trackingByBlockIndex.set(blockIndex, tracking);
        }
      });

      const trackedDocument = applyTicketTracking(
        loadMeetingDocument(note.document),
        trackingByBlockIndex,
      );
      await supabase.from("notes").update({ document: trackedDocument }).eq("id", note.id);
      updatedDocument = trackedDocument;
    }

    return NextResponse.json({
      tickets: created.map((workPackage) => ({
        id: workPackage.id,
        subject: workPackage.subject,
        url: service.buildWorkPackageUrl(workPackage),
      })),
      document: updatedDocument,
    });
  } catch (error) {
    if (error instanceof OpenProjectApiError) {
      console.error("OpenProject rechazó la creación de tickets:", error.status, error.body);
      return NextResponse.json(
        { error: "Error de OpenProject", details: error.body },
        { status: error.status },
      );
    }
    console.error("Error creando tickets:", error);
    const message = error instanceof Error ? error.message : "Error inesperado en el servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
