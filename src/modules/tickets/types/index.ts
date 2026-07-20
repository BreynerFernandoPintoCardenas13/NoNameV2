/**
 * Un ticket propuesto por la IA, pendiente de revisión humana. A diferencia
 * del `TicketDraft` de V1 (que guardaba los bytes de las imágenes en
 * memoria), este es serializable a jsonb: las imágenes viajan como
 * REFERENCIAS (`imageSrcs`, la URL firmada de Storage o un data-URL legado)
 * y los bytes se descargan en el servidor solo al confirmar la creación.
 */
export interface StoredTicketSection {
  description: string;
  imageSrcs: string[];
}

export interface StoredTicketDraft {
  ticketId: string;
  subject: string;
  sections: StoredTicketSection[];
  assigneeId?: number;
  assigneeName?: string;
  responsibleId?: number;
  responsibleName?: string;
  dueDate?: string;
  estimatedHours?: number;
  sourceBlockIndices: number[];
}

/** Forma resumida de un draft, lista para la tarjeta del modal de revisión. */
export interface PublicTicketDraft {
  subject: string;
  description: string;
  imageCount: number;
  assigneeName: string | null;
  responsibleName: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  projectName: string;
}

/** Ticket ya creado en OpenProject, para el modal de éxito. */
export interface CreatedTicket {
  id: number;
  subject: string;
  url: string;
}

export type AnalyzeResponse =
  { noPendingContent: true } | { analysisId: string; ticketDrafts: PublicTicketDraft[] };

export interface CreateTicketsResponse {
  tickets: CreatedTicket[];
  document: unknown;
}
