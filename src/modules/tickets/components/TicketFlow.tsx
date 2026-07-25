"use client";

import type { Editor } from "@tiptap/core";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { hasPendingTicketDrafts } from "@/modules/notes/services/meeting-document.service";
import type { MeetingDocument } from "@/modules/notes/types";
import type {
  AnalyzeResponse,
  CreateTicketsResponse,
  CreatedTicket,
  PublicTicketDraft,
} from "@/modules/tickets/types";

/**
 * El servidor ya adjunta el body de error real de OpenProject en `details`
 * (ver `api/meeting-notes/create-tickets/route.ts`), pero hasta ahora nunca
 * se leía — el usuario solo veía el string genérico "Error de OpenProject".
 * OpenProject devuelve `{ message }` para un error simple o
 * `{ _embedded: { errors: [{ message }, ...] } }` para varios a la vez
 * (ej. un campo "Asignado a"/"Responsable" que ya no es válido para ese
 * proyecto).
 */
function extractOpenProjectErrorMessage(details: unknown): string | null {
  if (typeof details !== "object" || details === null) return null;
  const body = details as {
    message?: string;
    _embedded?: { errors?: { message?: string }[] };
  };
  const messages = body._embedded?.errors?.map((e) => e.message).filter(Boolean) as
    string[] | undefined;
  if (messages && messages.length > 0) return messages.join(" · ");
  return body.message ?? null;
}

interface TicketFlowProps {
  editor: Editor | null;
  noteId: string;
  projectId: string;
  /** Aplica el documento congelado devuelto por el servidor sin disparar autoguardado. */
  onDocumentUpdated: (document: MeetingDocument) => void;
}

/**
 * Flujo "Crear Tickets" (portado de V1): chequeo local sin red → análisis
 * con IA → revisión humana obligatoria → creación real → aplicar documento
 * congelado + pantalla de éxito.
 */
export function TicketFlow({ editor, noteId, projectId, onDocumentUpdated }: TicketFlowProps) {
  const [analyzing, setAnalyzing] = React.useState(false);
  const [review, setReview] = React.useState<{
    analysisId: string;
    drafts: PublicTicketDraft[];
  } | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [createdTickets, setCreatedTickets] = React.useState<CreatedTicket[] | null>(null);

  const analyze = async () => {
    if (!editor) return;
    const document = editor.getJSON();

    // Antes de tocar red: ¿queda algún bloque activo? Si no, el flujo
    // termina aquí — sin fetch, sin prompt, sin llamar a Claude.
    if (!hasPendingTicketDrafts(document)) {
      toast.info("No se encontraron tickets nuevos para crear.");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/meeting-notes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, noteId, document }),
      });
      const body = (await res.json()) as AnalyzeResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Error desconocido");

      if ("noPendingContent" in body && body.noPendingContent) {
        toast.info("No se encontraron tickets nuevos para crear.");
        return;
      }
      if ("analysisId" in body) {
        setReview({ analysisId: body.analysisId, drafts: body.ticketDrafts });
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const confirm = async () => {
    if (!review) return;
    setCreating(true);
    try {
      const res = await fetch("/api/meeting-notes/create-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: review.analysisId }),
      });
      const body = (await res.json()) as CreateTicketsResponse & {
        error?: string;
        details?: unknown;
      };
      if (!res.ok) {
        throw new Error(
          extractOpenProjectErrorMessage(body.details) ?? body.error ?? "Error desconocido",
        );
      }

      if (body.document) onDocumentUpdated(body.document as MeetingDocument);
      setReview(null);
      setCreatedTickets(body.tickets);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={analyze} disabled={analyzing || !editor}>
        {analyzing ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles aria-hidden="true" />
        )}
        {analyzing ? "Analizando notas con IA…" : "Crear Tickets"}
      </Button>

      {/* Revisión humana obligatoria: nada se crea sin confirmar aquí. */}
      <Dialog open={review !== null} onOpenChange={(open) => !open && !creating && setReview(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Revisar tickets propuestos</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {review?.drafts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                La IA no encontró tickets en el contenido pendiente.
              </p>
            ) : (
              review?.drafts.map((draft, index) => (
                <article
                  key={index}
                  className="border-border/60 flex flex-col gap-2 rounded-xl border p-4"
                >
                  <h3 className="text-sm font-semibold">{draft.subject}</h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">
                    {draft.description}
                  </p>
                  <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>👤 {draft.assigneeName ?? "Sin asignar"}</span>
                    <span>✅ {draft.responsibleName ?? "Sin responsable"}</span>
                    <span>
                      ⏱{" "}
                      {draft.estimatedHours !== null ? `${draft.estimatedHours} h` : "Sin estimar"}
                    </span>
                    <span>📅 {draft.dueDate ?? "Sin fecha"}</span>
                    <span>🖼 {draft.imageCount} imagen(es)</span>
                    <span>📁 {draft.projectName}</span>
                  </div>
                </article>
              ))
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setReview(null)} disabled={creating}>
                Cancelar
              </Button>
              <Button onClick={confirm} disabled={creating || review?.drafts.length === 0}>
                {creating && <Loader2 className="animate-spin" aria-hidden="true" />}
                {creating ? "Creando tickets…" : "Crear en OpenProject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createdTickets !== null}
        onOpenChange={(open) => !open && setCreatedTickets(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tickets creados</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2.5 py-2">
            {createdTickets?.map((ticket) => (
              <article
                key={ticket.id}
                className="border-border/60 flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <span className="text-muted-foreground shrink-0 text-xs font-medium">
                  #{ticket.id}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{ticket.subject}</span>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<a href={ticket.url} target="_blank" rel="noopener noreferrer" />}
                >
                  <ExternalLink /> Abrir
                </Button>
              </article>
            ))}
            <div className="flex justify-end pt-1">
              <Button onClick={() => setCreatedTickets(null)}>Finalizar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
