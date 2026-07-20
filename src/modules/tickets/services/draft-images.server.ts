import "server-only";

import type { ImageInput, TicketDraft } from "@/modules/openproject/types";
import type { StoredTicketDraft } from "@/modules/tickets/types";

/**
 * Materializa los bytes de las imágenes de un draft justo antes de crear el
 * ticket: `imageSrcs` puede traer URLs firmadas de Storage (docs nuevos) o
 * data-URLs base64 (docs migrados de V1). Los bytes nunca se persisten en
 * `ticket_analyses` — solo viven lo que dura la creación.
 */
async function srcToImageInput(src: string, index: number): Promise<ImageInput> {
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/.exec(src);
  if (dataUrlMatch) {
    const [, contentType, base64] = dataUrlMatch;
    const extension = contentType.split("/")[1]?.split("+")[0] ?? "png";
    const buffer = Buffer.from(base64, "base64");
    return {
      fileName: `imagen-${index + 1}.${extension}`,
      contentType,
      bytes: new Uint8Array(buffer.buffer.slice(0)) as Uint8Array<ArrayBuffer>,
    };
  }

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`No se pudo descargar la imagen #${index + 1} de la nota.`);
  }
  const contentType = response.headers.get("content-type") ?? "image/png";
  const extension = contentType.split("/")[1]?.split("+")[0] ?? "png";
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { fileName: `imagen-${index + 1}.${extension}`, contentType, bytes };
}

/** Convierte los drafts almacenados (con referencias) en drafts con bytes reales. */
export async function materializeDrafts(stored: StoredTicketDraft[]): Promise<TicketDraft[]> {
  const drafts: TicketDraft[] = [];
  let imageCounter = 0;

  for (const draft of stored) {
    const sections = [];
    for (const section of draft.sections) {
      const images: ImageInput[] = [];
      for (const src of section.imageSrcs) {
        images.push(await srcToImageInput(src, imageCounter));
        imageCounter += 1;
      }
      sections.push({ description: section.description, images });
    }
    drafts.push({ ...draft, sections });
  }

  return drafts;
}
