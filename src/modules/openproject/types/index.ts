/** Tipos de la integración con OpenProject (API v3). Portados de NoNameV1. */

/** Señal (compartida server/client) de que el usuario aún no configuró su API Key. */
export const NO_API_KEY_ERROR = "NO_API_KEY";

export interface ImageInput {
  fileName: string;
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
}

/** Una sección independiente del ticket: una instrucción con sus propias imágenes. */
export interface TicketSection {
  description: string;
  images?: ImageInput[];
}

export interface CreateWorkPackageInput {
  projectId: string;
  subject: string;
  sections: TicketSection[]; // al menos una
  dueDate?: string; // formato YYYY-MM-DD
  estimatedTime?: string; // duración ISO 8601, ej. "PT8H"
  assigneeId?: number;
  responsibleId?: number;
}

export interface WorkPackage {
  id: number;
  subject: string;
  lockVersion: number;
  description: { format: string; raw: string; html: string };
  _links: {
    self: { href: string; title?: string };
  };
}

export interface Attachment {
  id: number;
  fileName: string;
  _links: {
    staticDownloadLocation: { href: string };
  };
}

export interface OpenProjectProject {
  id: number;
  identifier: string;
  name: string;
}

/** Un Tablero (Board) de OpenProject: internamente un Grid de tipo "free" (ver docs/V1-ARCHITECTURE.md). */
export interface Board {
  id: number;
  name: string;
}

/** Una columna del tablero: en realidad, una Query con orden manual. */
export interface BoardColumn {
  queryId: number;
  name: string;
}

export interface OpenProjectUser {
  id: number;
  name: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  login: string;
}

export interface WorkPackageType {
  id: number;
  name: string;
  position: number;
}

/**
 * Tipos crudos de las colecciones usadas por el Panel Administrador (ver
 * ADMIN_ANALYTICS_PLAN.md §1). Deliberadamente distintos de los tipos
 * livianos de arriba (`OpenProjectProject`/`OpenProjectUser`): esos ya
 * sirven al flujo de creación de tickets con una forma fija; estos exponen
 * la forma real de la respuesta HAL (links, `groups`, `totalSums`) que los
 * repositories de `modules/admin` necesitan para agregar/paginar.
 */

export interface WorkPackageLinkRef {
  href: string | null;
  title?: string | null;
}

/** Fila cruda de `/api/v3/work_packages` (sin `groupBy`). */
export interface WorkPackageListItem {
  id: number;
  subject: string;
  createdAt?: string;
  updatedAt?: string;
  _links: {
    project?: WorkPackageLinkRef;
    assignee?: WorkPackageLinkRef;
    responsible?: WorkPackageLinkRef;
    author?: WorkPackageLinkRef;
  };
}

/** Un grupo de `groupBy`+`showSums` — verificado en vivo: `value` es el nombre ya resuelto, el ID sale de `_links.valueLink`. */
export interface WorkPackageGroup {
  value: string | number | null;
  count: number;
  sums?: Record<string, string | number | null>;
  _links?: { valueLink?: { href: string }[] };
}

/**
 * Respuesta de `/api/v3/work_packages`. `groups`/`totalSums` van al nivel
 * raíz (verificado en vivo contra la instancia real — la documentación
 * oficial sugiere `_embedded.groups`/`_embedded.totalSums`, pero esta
 * versión del core de OpenProject los devuelve fuera de `_embedded`).
 */
export interface WorkPackageCollection {
  total: number;
  count: number;
  groups?: WorkPackageGroup[];
  totalSums?: Record<string, string | number | null>;
  _embedded: { elements?: WorkPackageListItem[] };
}

export interface WorkPackageQueryParams {
  filters?: string;
  groupBy?: string;
  showSums?: boolean;
  select?: string;
  sortBy?: string;
  offset?: number;
  pageSize?: number;
}

export interface ProjectListItem {
  id: number;
  identifier: string;
  name: string;
  active: boolean;
}

export interface UserListItem {
  id: number;
  name: string;
  status: string;
}

export interface MembershipListItem {
  id: number;
  _links: {
    project?: WorkPackageLinkRef;
    principal?: WorkPackageLinkRef;
    roles?: WorkPackageLinkRef[];
  };
}

export interface TimeEntryListItem {
  id: number;
  hours: string;
  spentOn: string;
  _links: {
    project?: WorkPackageLinkRef;
    user?: WorkPackageLinkRef;
    workPackage?: WorkPackageLinkRef;
  };
}

export interface StatusListItem {
  id: number;
  name: string;
  isClosed: boolean;
}

export class OpenProjectApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`OpenProject API respondió ${status}: ${JSON.stringify(body)}`);
    this.name = "OpenProjectApiError";
  }
}

/**
 * Un ticket propuesto por la IA a partir de las notas de la reunión,
 * pendiente de revisión humana antes de crearse en OpenProject.
 * `sourceBlockIndices` son las posiciones reales (en `document.content`) de
 * los bloques de origen — se usan tras la creación para congelarlos (Frozen).
 */
export interface TicketDraft {
  ticketId: string;
  subject: string;
  sections: TicketSection[];
  assigneeId?: number;
  assigneeName?: string;
  responsibleId?: number;
  responsibleName?: string;
  dueDate?: string;
  estimatedHours?: number;
  sourceBlockIndices: number[];
}
