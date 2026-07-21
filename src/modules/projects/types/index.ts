/**
 * Proyecto local de la aplicación (organización interna): no es un proyecto
 * de OpenProject, solo mantiene una referencia hacia uno. Portado de V1;
 * en V2 además pertenece a un usuario (RLS por owner_auth_id en la BD).
 */
export interface LocalProject {
  id: string;
  name: string;
  openProjectId: number;
  openProjectName: string;
  boardId?: number;
  boardName?: string;
  boardListId?: number;
  boardListName?: string;
}

export type LocalProjectInput = Omit<LocalProject, "id">;

/**
 * Un Encargado: persona relacionada con el Proyecto (nombre, correo,
 * teléfono opcional). NO es un usuario de OpenProject — información propia
 * de la app, fuente de participantes de reuniones.
 */
export interface ProjectManager {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone?: string;
}

/** Fila cruda de `projects` en Supabase (snake_case). */
export interface ProjectRow {
  id: string;
  name: string;
  openproject_id: number;
  openproject_name: string;
  board_id: number | null;
  board_name: string | null;
  board_list_id: number | null;
  board_list_name: string | null;
}

export function toLocalProject(row: ProjectRow): LocalProject {
  return {
    id: row.id,
    name: row.name,
    openProjectId: row.openproject_id,
    openProjectName: row.openproject_name,
    ...(row.board_id !== null ? { boardId: row.board_id, boardName: row.board_name ?? "" } : {}),
    ...(row.board_list_id !== null
      ? { boardListId: row.board_list_id, boardListName: row.board_list_name ?? "" }
      : {}),
  };
}

export function toProjectRow(input: LocalProjectInput): Omit<ProjectRow, "id"> {
  return {
    name: input.name,
    openproject_id: input.openProjectId,
    openproject_name: input.openProjectName,
    board_id: input.boardId ?? null,
    board_name: input.boardName ?? null,
    board_list_id: input.boardListId ?? null,
    board_list_name: input.boardListName ?? null,
  };
}
