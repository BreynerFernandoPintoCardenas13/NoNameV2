import type { PublicTicketDraft, StoredTicketDraft } from "@/modules/tickets/types";

/** Forma resumida de un draft para la tarjeta del modal de revisión (portado de V1). */
export function toPublicTicketDraft(
  draft: StoredTicketDraft,
  projectName: string,
): PublicTicketDraft {
  return {
    subject: draft.subject,
    description: draft.sections.map((section) => section.description).join("\n\n"),
    imageCount: draft.sections.reduce((total, section) => total + section.imageSrcs.length, 0),
    assigneeName: draft.assigneeName ?? null,
    responsibleName: draft.responsibleName ?? null,
    dueDate: draft.dueDate ?? null,
    estimatedHours: draft.estimatedHours ?? null,
    projectName,
  };
}
