import { logger } from "@/lib/logger";
import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";
import {
  EMPTY_DOCUMENT,
  type MeetingDocument,
  type MeetingNote,
  type MeetingNoteSummary,
} from "@/modules/notes/types";

/**
 * Única puerta a la tabla `notes` (RLS vía proyecto dueño). Contratos
 * heredados de `MeetingNoteService` de V1. El listado de la sidebar NUNCA
 * trae el documento (puede pesar mucho); el documento completo solo se pide
 * al abrir una nota.
 */

interface NoteRow {
  id: string;
  project_id: string;
  title: string;
  document?: MeetingDocument;
  created_at: string;
  updated_at: string;
}

const SUMMARY_COLUMNS = "id, project_id, title, created_at, updated_at";

function toSummary(row: NoteRow): MeetingNoteSummary {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotesByProject(projectId: string): Promise<MeetingNoteSummary[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("notes")
    .select(SUMMARY_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    logger.error("No se pudieron cargar las notas:", error);
    throw new Error(`No se pudieron cargar las notas (${error.message}).`);
  }
  return (data as NoteRow[]).map(toSummary);
}

export async function getNote(id: string): Promise<MeetingNote> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("notes")
    .select(`${SUMMARY_COLUMNS}, document`)
    .eq("id", id)
    .single();
  if (error) throw new Error("No se pudo cargar la nota.");
  const row = data as Required<NoteRow>;
  return { ...toSummary(row), document: row.document };
}

export async function createNote(projectId: string): Promise<MeetingNoteSummary> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("notes")
    .insert({ project_id: projectId, title: "", document: EMPTY_DOCUMENT })
    .select(SUMMARY_COLUMNS)
    .single();
  if (error) throw new Error("No se pudo crear la nota.");
  return toSummary(data as NoteRow);
}

/** Autoguardado: título y/o documento, lo que haya cambiado. */
export async function updateNote(
  id: string,
  changes: { title?: string; document?: MeetingDocument },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (changes.title !== undefined) patch.title = changes.title;
  if (changes.document !== undefined) patch.document = changes.document;
  if (Object.keys(patch).length === 0) return;

  const { error } = await getSupabaseBrowserClient().from("notes").update(patch).eq("id", id);
  if (error) throw new Error("No se pudo guardar la nota.");
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().from("notes").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar la nota.");
}
