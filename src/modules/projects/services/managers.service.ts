import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";
import type { ProjectManager } from "@/modules/projects/types";

/** CRUD de Encargados (tabla `project_managers`, RLS vía proyecto dueño). */

interface ManagerRow {
  id: string;
  project_id: string;
  name: string;
  email: string;
  phone: string | null;
}

const COLUMNS = "id, project_id, name, email, phone";

function toManager(row: ManagerRow): ProjectManager {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    email: row.email,
    ...(row.phone ? { phone: row.phone } : {}),
  };
}

export interface ManagerInput {
  name: string;
  email: string;
  phone?: string;
}

export async function listManagers(projectId: string): Promise<ProjectManager[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("project_managers")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("No se pudieron cargar los encargados.");
  return (data as ManagerRow[]).map(toManager);
}

export async function createManager(
  projectId: string,
  input: ManagerInput,
): Promise<ProjectManager> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("project_managers")
    .insert({
      project_id: projectId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error("No se pudo crear el encargado.");
  return toManager(data as ManagerRow);
}

export async function updateManager(id: string, input: ManagerInput): Promise<ProjectManager> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("project_managers")
    .update({ name: input.name, email: input.email, phone: input.phone ?? null })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error("No se pudo actualizar el encargado.");
  return toManager(data as ManagerRow);
}

export async function deleteManager(id: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().from("project_managers").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar el encargado.");
}
