import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";
import { EMPTY_DOCUMENT, type MeetingDocument } from "@/modules/notes/types";

/**
 * Base de conocimiento de un Proyecto: información permanente (credenciales
 * de prueba, URLs, decisiones...) que NO pertenece a ninguna reunión.
 * Relación 1:1 con el proyecto (unique en la BD). Portado de V1 sobre la
 * tabla `project_knowledge` (RLS vía proyecto dueño).
 */

export interface ProjectKnowledge {
  projectId: string;
  document: MeetingDocument;
}

export async function getOrCreateKnowledge(projectId: string): Promise<ProjectKnowledge> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_knowledge")
    .select("project_id, document")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la base de conocimiento.");

  if (data) {
    return { projectId, document: data.document as MeetingDocument };
  }

  const { error: insertError } = await supabase
    .from("project_knowledge")
    .insert({ project_id: projectId, document: EMPTY_DOCUMENT });
  if (insertError) throw new Error("No se pudo crear la base de conocimiento.");
  return { projectId, document: EMPTY_DOCUMENT };
}

export async function updateKnowledge(projectId: string, document: MeetingDocument): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("project_knowledge")
    .update({ document })
    .eq("project_id", projectId);
  if (error) throw new Error("No se pudo guardar la base de conocimiento.");
}
