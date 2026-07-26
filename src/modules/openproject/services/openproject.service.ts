import "server-only";

import { createClient } from "@supabase/supabase-js";

import { authServerEnv, openProjectEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.public";
import { logger } from "@/lib/logger";
import { OpenProjectClient } from "@/modules/openproject/services/openproject-client";
import type {
  Board,
  BoardColumn,
  CurrentUser,
  MembershipListItem,
  OpenProjectProject,
  OpenProjectUser,
  ProjectListItem,
  StatusListItem,
  TicketDraft,
  TimeEntryListItem,
  UserListItem,
  WorkPackage,
  WorkPackageCollection,
  WorkPackageQueryParams,
} from "@/modules/openproject/types";
import { hoursToIso8601Duration } from "@/modules/openproject/utils/duration";

/**
 * Fachada de dominio sobre `OpenProjectClient`, portada de NoNameV1 con un
 * cambio estructural: la API Key ya no vive en un JSON en disco sino en la
 * columna `users.openproject_api_key` de Supabase (SELECT revocado para el
 * cliente — solo este módulo, con la service role y únicamente en servidor,
 * puede leerla). Se construye un cliente nuevo por instancia/llamada: si el
 * usuario cambia su key, la siguiente acción ya usa la nueva.
 *
 * La key nunca se loguea, nunca se devuelve en respuestas y nunca sale de
 * este archivo.
 */

/** Lee la API Key de OpenProject del usuario. SOLO servidor (service role). */
async function getApiKeyForUser(authId: string): Promise<string | null> {
  const admin = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    authServerEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await admin
    .from("users")
    .select("openproject_api_key")
    .eq("auth_id", authId)
    .maybeSingle();
  if (error) return null;
  return (data?.openproject_api_key as string | null) ?? null;
}

export class OpenProjectService {
  private constructor(
    private readonly client: OpenProjectClient,
    private readonly baseUrl: string,
  ) {}

  /** Servicio listo para actuar como el usuario indicado, o `null` si no tiene API Key configurada. */
  static async forUser(authId: string): Promise<OpenProjectService | null> {
    const apiKey = await getApiKeyForUser(authId);
    if (!apiKey) return null;
    const baseUrl = openProjectEnv().OPENPROJECT_BASE_URL;
    return new OpenProjectService(new OpenProjectClient({ baseUrl, apiToken: apiKey }), baseUrl);
  }

  /** Servicio con una key explícita (verificación al guardar una key nueva). */
  static withApiKey(apiKey: string): OpenProjectService {
    const baseUrl = openProjectEnv().OPENPROJECT_BASE_URL;
    return new OpenProjectService(new OpenProjectClient({ baseUrl, apiToken: apiKey }), baseUrl);
  }

  /** El usuario dueño de la API Key configurada — quién "es" el PM ante OpenProject. */
  async getCurrentUser(): Promise<CurrentUser> {
    return this.client.getCurrentUser();
  }

  /** Proyectos reales de OpenProject, para vincular un proyecto local a uno de ellos. */
  async listAvailableProjects(): Promise<OpenProjectProject[]> {
    return this.client.listProjects();
  }

  /** Usuarios asignables de un proyecto de OpenProject, para "Asignado a...". */
  async listAssignableUsers(openProjectId: string): Promise<OpenProjectUser[]> {
    return this.client.listAssignableUsers(openProjectId);
  }

  /** Usuarios que pueden ser "Responsable" de un proyecto de OpenProject. */
  async listResponsibleUsers(openProjectId: string): Promise<OpenProjectUser[]> {
    return this.client.listResponsibleUsers(openProjectId);
  }

  /** Tableros del proyecto de OpenProject vinculado. */
  async listProjectBoards(openProjectId: number): Promise<Board[]> {
    return this.client.listProjectBoards(openProjectId);
  }

  /** Columnas de un tablero. */
  async listBoardColumns(boardId: number): Promise<BoardColumn[]> {
    return this.client.listBoardColumns(boardId);
  }

  /**
   * Crea un Work Package por cada ticket propuesto. Si el proyecto local
   * tiene tablero configurado (`boardListId`), ubica además cada ticket en
   * esa columna — paso best-effort: si falla, el ticket ya creado no se
   * pierde, solo se registra el error.
   */
  async createTicketsFromDrafts(
    openProjectId: string,
    drafts: TicketDraft[],
    boardListId?: number,
  ): Promise<WorkPackage[]> {
    const created: WorkPackage[] = [];
    for (const draft of drafts) {
      const workPackage = await this.client.createWorkPackage({
        projectId: openProjectId,
        subject: draft.subject,
        sections: draft.sections,
        assigneeId: draft.assigneeId,
        responsibleId: draft.responsibleId,
        dueDate: draft.dueDate,
        estimatedTime:
          draft.estimatedHours !== undefined
            ? hoursToIso8601Duration(draft.estimatedHours)
            : undefined,
      });
      created.push(workPackage);

      if (boardListId !== undefined) {
        try {
          await this.client.addWorkPackageToBoardColumn(boardListId, workPackage.id);
        } catch (error) {
          logger.error(`No se pudo ubicar el ticket #${workPackage.id} en el tablero:`, error);
        }
      }
    }
    return created;
  }

  // --- Panel Administrador (ver ADMIN_ANALYTICS_PLAN.md §2.1): passthrough
  // hacia los nuevos métodos `query*`/`listStatuses` de `OpenProjectClient`,
  // reutilizando `this.client` — sin cliente HTTP paralelo.

  async queryWorkPackages(params: WorkPackageQueryParams): Promise<WorkPackageCollection> {
    return this.client.queryWorkPackages(params);
  }

  async queryProjects(params: { filters?: string; pageSize?: number }): Promise<{
    total: number;
    elements: ProjectListItem[];
  }> {
    return this.client.queryProjects(params);
  }

  async queryUsers(params: { filters?: string; pageSize?: number }): Promise<{
    total: number;
    elements: UserListItem[];
  }> {
    return this.client.queryUsers(params);
  }

  async queryMemberships(params: { filters?: string; pageSize?: number }): Promise<{
    total: number;
    elements: MembershipListItem[];
  }> {
    return this.client.queryMemberships(params);
  }

  async queryTimeEntries(params: {
    filters?: string;
    pageSize?: number;
    offset?: number;
  }): Promise<{
    total: number;
    elements: TimeEntryListItem[];
  }> {
    return this.client.queryTimeEntries(params);
  }

  async listStatuses(): Promise<StatusListItem[]> {
    return this.client.listStatuses();
  }

  /**
   * URL completa del ticket ya creado — la del front-end web de OpenProject
   * (`/work_packages/:id`), NO la de la API (que exige Basic Auth y responde
   * 401 en un clic normal del navegador).
   */
  buildWorkPackageUrl(workPackage: WorkPackage): string {
    return `${this.baseUrl}/work_packages/${workPackage.id}`;
  }
}
