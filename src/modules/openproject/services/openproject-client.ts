import "server-only";

import {
  type Attachment,
  type Board,
  type BoardColumn,
  type CreateWorkPackageInput,
  type CurrentUser,
  type ImageInput,
  type MembershipListItem,
  OpenProjectApiError,
  type OpenProjectProject,
  type OpenProjectUser,
  type ProjectListItem,
  type StatusListItem,
  type TicketSection,
  type TimeEntryListItem,
  type UserListItem,
  type WorkPackage,
  type WorkPackageCollection,
  type WorkPackageQueryParams,
  type WorkPackageType,
} from "@/modules/openproject/types";

/**
 * Cliente mínimo para la API v3 de OpenProject. Portado de NoNameV1.
 *
 * Autenticación: OpenProject usa HTTP Basic Auth donde el "usuario" es
 * literalmente la palabra "apikey" y la "contraseña" es el token generado
 * en Mi cuenta > Tokens de API. Referencia oficial:
 * https://www.openproject.org/docs/api/authentication/
 *
 * SOLO SERVIDOR: la API Key jamás debe tocar el navegador.
 */

interface OpenProjectClientOptions {
  baseUrl: string;
  apiToken: string;
}

export class OpenProjectClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor({ baseUrl, apiToken }: OpenProjectClientOptions) {
    this.baseUrl = baseUrl;
    // Basic Auth: "apikey:<token>" en base64.
    this.authHeader = "Basic " + Buffer.from(`apikey:${apiToken}`).toString("base64");
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new OpenProjectApiError(response.status, body);
    }

    return body as T;
  }

  /**
   * Sube un archivo como adjunto de un work package ya creado.
   * Doc: https://www.openproject.org/docs/api/endpoints/attachments/#upload-an-attachment-via-work-package
   */
  async uploadAttachment(workPackageId: number, image: ImageInput): Promise<Attachment> {
    const form = new FormData();
    // Debe ir como string plano: si se envuelve en un Blob, FormData le añade
    // un "filename" automático y Rails lo interpreta como archivo en vez de
    // como texto, rompiendo el parseo en el lado de OpenProject.
    form.append("metadata", JSON.stringify({ fileName: image.fileName }));
    form.append("file", new Blob([image.bytes], { type: image.contentType }), image.fileName);

    const response = await fetch(
      `${this.baseUrl}/api/v3/work_packages/${workPackageId}/attachments`,
      {
        method: "POST",
        headers: { Authorization: this.authHeader },
        body: form,
      },
    );

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new OpenProjectApiError(response.status, body);
    }

    return body as Attachment;
  }

  /** El usuario dueño de este token (`/users/me`) — quién está "detrás" de la API Key. */
  async getCurrentUser(): Promise<CurrentUser> {
    return this.request<CurrentUser>("/api/v3/users/me");
  }

  /** Lista los proyectos visibles con este token. */
  async listProjects(): Promise<OpenProjectProject[]> {
    const result = await this.request<{ _embedded: { elements: OpenProjectProject[] } }>(
      "/api/v3/projects?pageSize=200",
    );
    return result._embedded.elements;
  }

  /**
   * Tableros (Boards) del proyecto. Un Board no existe como recurso propio en
   * la API v3: por dentro es un `Grid` con `options.type === "free"` cuyo
   * `scope` es `/projects/{id}/boards`. Ver docs/V1-ARCHITECTURE.md para la
   * investigación completa.
   */
  async listProjectBoards(projectId: string | number): Promise<Board[]> {
    const filters = JSON.stringify([
      { scope: { operator: "=", values: [`/projects/${projectId}/boards`] } },
    ]);
    const result = await this.request<{
      _embedded: { elements: { id: number; name: string; options?: { type?: string } }[] };
    }>(`/api/v3/grids?filters=${encodeURIComponent(filters)}`);
    return result._embedded.elements
      .filter((grid) => grid.options?.type === "free") // solo tableros "Basic/free"; los Action boards (Enterprise) no están soportados
      .map((grid) => ({ id: grid.id, name: grid.name }));
  }

  /**
   * Columnas de un tablero, en orden. Cada columna es un widget
   * "work_package_query" del Grid, respaldado por una Query con orden manual —
   * su `name` es el título visible de la columna (p. ej. "Nuevo").
   */
  async listBoardColumns(boardId: number): Promise<BoardColumn[]> {
    const grid = await this.request<{
      widgets: { identifier: string; startColumn: number; options: { queryId: number | string } }[];
    }>(`/api/v3/grids/${boardId}`);

    const queryIds = grid.widgets
      .filter((widget) => widget.identifier === "work_package_query")
      .sort((a, b) => a.startColumn - b.startColumn)
      .map((widget) => Number(widget.options.queryId));
    if (queryIds.length === 0) return [];

    const filters = JSON.stringify([{ id: { operator: "=", values: queryIds.map(String) } }]);
    const result = await this.request<{ _embedded: { elements: { id: number; name: string }[] } }>(
      `/api/v3/queries?filters=${encodeURIComponent(filters)}`,
    );
    const namesById = new Map(result._embedded.elements.map((query) => [query.id, query.name]));
    return queryIds.map((queryId) => ({
      queryId,
      name: namesById.get(queryId) ?? `Columna ${queryId}`,
    }));
  }

  /**
   * Ubica un Work Package ya creado dentro de una columna del tablero.
   * Endpoint NO documentado (`PATCH /queries/{id}/order`): es de uso interno
   * del frontend de OpenProject (drag & drop de tarjetas), pero es el único
   * mecanismo real — pertenecer a la columna ES tener una fila en
   * `ordered_work_packages` para esa query. `delta` mapea
   * workPackageId -> posición (0 = primero).
   */
  async addWorkPackageToBoardColumn(queryId: number, workPackageId: number): Promise<void> {
    await this.request(`/api/v3/queries/${queryId}/order`, {
      method: "PATCH",
      body: JSON.stringify({ delta: { [workPackageId]: 0 } }),
    });
  }

  /** Usuarios que pueden ser asignados ("Asignado a") en un proyecto. */
  async listAssignableUsers(projectId: string): Promise<OpenProjectUser[]> {
    const result = await this.request<{ _embedded: { elements: OpenProjectUser[] } }>(
      `/api/v3/projects/${encodeURIComponent(projectId)}/available_assignees`,
    );
    return result._embedded.elements;
  }

  /** Usuarios que pueden ser "Responsable" en un proyecto. */
  async listResponsibleUsers(projectId: string): Promise<OpenProjectUser[]> {
    const result = await this.request<{ _embedded: { elements: OpenProjectUser[] } }>(
      `/api/v3/projects/${encodeURIComponent(projectId)}/available_responsibles`,
    );
    return result._embedded.elements;
  }

  /**
   * Tipos de work package habilitados en el proyecto (Tarea, Bug, Hito, ...),
   * ordenados por posición. El primero se usa como tipo por defecto al crear
   * un ticket desde el formulario, que no pide el tipo explícitamente.
   */
  async listWorkPackageTypes(projectId: string): Promise<WorkPackageType[]> {
    const result = await this.request<{ _embedded: { elements: WorkPackageType[] } }>(
      `/api/v3/projects/${encodeURIComponent(projectId)}/types`,
    );
    return result._embedded.elements.sort((a, b) => a.position - b.position);
  }

  /**
   * Crea un ticket (work package) dentro de un proyecto.
   * Doc: https://www.openproject.org/docs/api/endpoints/work-packages/#create-work-package
   *
   * El ticket se compone de una o varias secciones (cada una, una instrucción
   * independiente con sus propias imágenes). Como un adjunto solo se puede
   * subir cuando el work package ya existe, el flujo es:
   *   1. Crear el ticket con el texto de cada sección (sin imágenes todavía).
   *   2. Subir las imágenes de cada sección como adjuntos del ticket creado.
   *   3. Reescribir la descripción incluyendo, dentro de cada sección, las
   *      imágenes ya subidas como markdown embebido.
   */
  async createWorkPackage(input: CreateWorkPackageInput): Promise<WorkPackage> {
    const types = await this.listWorkPackageTypes(input.projectId);
    const defaultType = types[0];
    if (!defaultType) {
      throw new Error(`El proyecto ${input.projectId} no tiene tipos de ticket habilitados.`);
    }

    const initialDescriptionRaw = buildSectionsMarkdown(input.sections, []);

    const workPackage = await this.request<WorkPackage>(
      `/api/v3/projects/${encodeURIComponent(input.projectId)}/work_packages`,
      {
        method: "POST",
        body: JSON.stringify({
          subject: input.subject,
          ...(initialDescriptionRaw
            ? { description: { format: "markdown", raw: initialDescriptionRaw } }
            : {}),
          ...(input.dueDate ? { dueDate: input.dueDate } : {}),
          ...(input.estimatedTime ? { estimatedTime: input.estimatedTime } : {}),
          _links: {
            type: { href: `/api/v3/types/${defaultType.id}` },
            ...(input.assigneeId
              ? { assignee: { href: `/api/v3/users/${input.assigneeId}` } }
              : {}),
            ...(input.responsibleId
              ? { responsible: { href: `/api/v3/users/${input.responsibleId}` } }
              : {}),
          },
        }),
      },
    );

    const hasImages = input.sections.some((section) => (section.images?.length ?? 0) > 0);
    if (!hasImages) {
      return workPackage;
    }

    const attachmentsPerSection: Attachment[][] = [];
    for (const section of input.sections) {
      const attachments: Attachment[] = [];
      for (const image of section.images ?? []) {
        attachments.push(await this.uploadAttachment(workPackage.id, image));
      }
      attachmentsPerSection.push(attachments);
    }

    const finalDescriptionRaw = buildSectionsMarkdown(input.sections, attachmentsPerSection);

    return this.request<WorkPackage>(`/api/v3/work_packages/${workPackage.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        lockVersion: workPackage.lockVersion,
        description: { format: "markdown", raw: finalDescriptionRaw },
      }),
    });
  }
  // --- Panel Administrador (ver ADMIN_ANALYTICS_PLAN.md §1/§2.1): métodos de
  // consulta cruda añadidos al mismo cliente, sin HTTP paralelo. `query*`
  // (no `list*`) para no chocar con los `list*` de arriba, que sirven un
  // caso de uso distinto (opciones fijas de formulario, sin filtros/total).

  /** Colección cruda de `/api/v3/work_packages`: filtros/groupBy/showSums/select/orden/paginación (§1.2/§3). */
  async queryWorkPackages(params: WorkPackageQueryParams = {}): Promise<WorkPackageCollection> {
    const query = new URLSearchParams();
    if (params.filters) query.set("filters", params.filters);
    if (params.groupBy) query.set("groupBy", params.groupBy);
    if (params.showSums) query.set("showSums", "true");
    if (params.select) query.set("select", params.select);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.offset !== undefined) query.set("offset", String(params.offset));
    if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));
    return this.request<WorkPackageCollection>(`/api/v3/work_packages?${query.toString()}`);
  }

  /** Proyectos con filtros/paginación/total — a diferencia de `listProjects()`, pensado para reportes (§1.4). */
  async queryProjects(
    params: { filters?: string; pageSize?: number } = {},
  ): Promise<{ total: number; elements: ProjectListItem[] }> {
    const query = new URLSearchParams();
    if (params.filters) query.set("filters", params.filters);
    query.set("pageSize", String(params.pageSize ?? 1));
    const result = await this.request<{
      total: number;
      _embedded: { elements: ProjectListItem[] };
    }>(`/api/v3/projects?${query.toString()}`);
    return { total: result.total, elements: result._embedded.elements };
  }

  /** Usuarios con filtros/paginación/total (§1.5). */
  async queryUsers(
    params: { filters?: string; pageSize?: number } = {},
  ): Promise<{ total: number; elements: UserListItem[] }> {
    const query = new URLSearchParams();
    if (params.filters) query.set("filters", params.filters);
    query.set("pageSize", String(params.pageSize ?? 1));
    const result = await this.request<{ total: number; _embedded: { elements: UserListItem[] } }>(
      `/api/v3/users?${query.toString()}`,
    );
    return { total: result.total, elements: result._embedded.elements };
  }

  /** Memberships (usuario↔proyecto↔rol) — única tabla de unión real (§1.6). */
  async queryMemberships(
    params: { filters?: string; pageSize?: number } = {},
  ): Promise<{ total: number; elements: MembershipListItem[] }> {
    const query = new URLSearchParams();
    if (params.filters) query.set("filters", params.filters);
    query.set("pageSize", String(params.pageSize ?? 100));
    const result = await this.request<{
      total: number;
      _embedded: { elements: MembershipListItem[] };
    }>(`/api/v3/memberships?${query.toString()}`);
    return { total: result.total, elements: result._embedded.elements };
  }

  /** Time entries — horas REALES registradas, distinto de `estimatedTime` (§1.7). Sin agregación nativa. */
  async queryTimeEntries(
    params: { filters?: string; pageSize?: number; offset?: number } = {},
  ): Promise<{ total: number; elements: TimeEntryListItem[] }> {
    const query = new URLSearchParams();
    if (params.filters) query.set("filters", params.filters);
    query.set("pageSize", String(params.pageSize ?? 100));
    if (params.offset !== undefined) query.set("offset", String(params.offset));
    const result = await this.request<{
      total: number;
      _embedded: { elements: TimeEntryListItem[] };
    }>(`/api/v3/time_entries?${query.toString()}`);
    return { total: result.total, elements: result._embedded.elements };
  }

  /** Catálogo global de statuses — `isClosed` es la base de "abierto/cerrado" (§1.9). Sin filtros, sin paginar. */
  async listStatuses(): Promise<StatusListItem[]> {
    const result = await this.request<{ _embedded: { elements: StatusListItem[] } }>(
      "/api/v3/statuses",
    );
    return result._embedded.elements;
  }
}

/**
 * Arma el markdown final de la descripción a partir de las secciones. Las
 * secciones existen para organizar internamente la información (asociar
 * cada instrucción con sus propias imágenes), no para mostrarse: nunca se
 * numeran ni llevan encabezado — el ticket debe leerse como un único
 * documento continuo, separando secciones solo con una línea en blanco.
 */
function buildSectionsMarkdown(
  sections: TicketSection[],
  attachmentsPerSection: Attachment[][],
): string {
  const blocks = sections.map((section, index) => {
    const attachments = attachmentsPerSection[index] ?? [];
    const imagesMarkdown = attachments
      .map((a) => `![${a.fileName}](/api/v3/attachments/${a.id}/content)`)
      .join("\n");

    return [section.description.trim(), imagesMarkdown].filter(Boolean).join("\n\n");
  });

  return blocks.filter(Boolean).join("\n\n");
}
