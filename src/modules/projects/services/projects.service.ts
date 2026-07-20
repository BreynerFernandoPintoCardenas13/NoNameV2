import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";
import {
  type LocalProject,
  type LocalProjectInput,
  type ProjectRow,
  toLocalProject,
  toProjectRow,
} from "@/modules/projects/types";

/**
 * Única puerta a la tabla `projects` (RLS: cada usuario solo ve/toca los
 * suyos). Mismos contratos que `ProjectService` de V1, con Supabase como
 * persistencia en lugar de un JSON en disco.
 */

const COLUMNS =
  "id, name, openproject_id, openproject_name, board_id, board_name, board_list_id, board_list_name";

export async function listProjects(): Promise<LocalProject[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("projects")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error("No se pudieron cargar los proyectos.");
  return (data as ProjectRow[]).map(toLocalProject);
}

export async function createProject(input: LocalProjectInput): Promise<LocalProject> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("projects")
    .insert(toProjectRow(input))
    .select(COLUMNS)
    .single();
  if (error) throw new Error("No se pudo crear el proyecto.");
  return toLocalProject(data as ProjectRow);
}

/**
 * Reemplaza todos los campos del proyecto (salvo `id`). No es un merge
 * parcial a propósito: el modal "Editar proyecto" siempre envía el estado
 * completo del formulario — un merge dejaría un tablero viejo huérfano
 * cuando el usuario lo quita (semántica heredada de V1).
 */
export async function updateProject(id: string, input: LocalProjectInput): Promise<LocalProject> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("projects")
    .update(toProjectRow(input))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error("No se pudo actualizar el proyecto.");
  return toLocalProject(data as ProjectRow);
}

/** Renombrado rápido desde la sidebar: solo cambia `name`. */
export async function renameProject(id: string, name: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().from("projects").update({ name }).eq("id", id);
  if (error) throw new Error("No se pudo renombrar el proyecto.");
}

/**
 * Elimina el proyecto. Sus notas, KB y encargados caen por cascada de FK
 * (en V1 esto eran tres `deleteByProject` manuales). No toca OpenProject.
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().from("projects").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar el proyecto.");
}
