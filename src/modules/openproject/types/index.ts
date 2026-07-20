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
