import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { JSONContent } from "@tiptap/core";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { aiEnv } from "@/lib/env";
import {
  MeetingPromptBuilder,
  type MeetingAnalysisContext,
} from "@/modules/ai/services/meeting-prompt-builder";
import type { MeetingDocument } from "@/modules/notes/types";
import type { StoredTicketDraft } from "@/modules/tickets/types";

const MODEL = "claude-sonnet-5";

const TicketSectionSchema = z.object({
  description: z
    .string()
    .describe(
      'Texto de la sección, ya redactado y listo para enviarse a OpenProject. Prosa continua: sin "Sección N", sin encabezados ni numeración — el ticket final une todas las secciones como un único documento.',
    ),
  imageIndices: z
    .array(z.number().int())
    .describe("Índices (imageIndex) de las imágenes del documento que pertenecen a esta sección."),
});

const TicketDraftSchema = z.object({
  subject: z.string().describe("Título corto y claro del ticket."),
  sections: z.array(TicketSectionSchema).min(1),
  assigneeId: z.number().int().nullable(),
  assigneeName: z.string().nullable(),
  dueDate: z
    .string()
    .nullable()
    .describe("Fecha límite en formato YYYY-MM-DD, tomada del metadato dueDate del bloque."),
  estimatedHours: z
    .number()
    .nullable()
    .describe(
      "Horas estimadas (puede tener decimales), tomadas del metadato estimatedTime del bloque.",
    ),
  sourceBlockIndices: z
    .array(z.number().int())
    .describe(
      "Todos los blockIndex (el atributo que trae cada bloque de nivel superior del documento) usados para construir este ticket, en cualquiera de sus secciones. Un mismo blockIndex no debe aparecer en más de un ticket.",
    ),
});

const AnalysisResponseSchema = z.object({
  tickets: z.array(TicketDraftSchema),
});

/**
 * Único servicio que se comunica con la API de Anthropic (portado de V1).
 * Su responsabilidad termina en devolver `StoredTicketDraft[]` — no sabe
 * nada de OpenProject ni de HTTP. El "responsable" NUNCA se le pide a
 * Claude: no existe en el schema de respuesta; se fija después con el valor
 * ya resuelto por la configuración del usuario — estructuralmente imposible
 * que la IA lo determine.
 */
export class MeetingAIService {
  private readonly client: Anthropic;

  constructor(private readonly promptBuilder: MeetingPromptBuilder = new MeetingPromptBuilder()) {
    this.client = new Anthropic({ apiKey: aiEnv().ANTHROPIC_API_KEY });
  }

  /**
   * Analiza el documento (ya pasado por `prepareForAI`) y propone tickets.
   * No crea nada en OpenProject: el resultado es una propuesta pendiente de
   * revisión humana.
   */
  async analyzeMeetingNotes(
    document: MeetingDocument,
    context: MeetingAnalysisContext,
    responsible: { id: number; name: string } | null,
  ): Promise<StoredTicketDraft[]> {
    const { imageSrcs, imageBlockIndices, sanitizedDocument } = extractImages(document);

    let response;
    try {
      response = await this.client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: this.promptBuilder.buildSystemPrompt(context),
        output_config: {
          effort: "high",
          format: zodOutputFormat(AnalysisResponseSchema),
        },
        messages: [
          { role: "user", content: this.promptBuilder.buildUserMessage(sanitizedDocument) },
        ],
      });
    } catch (error) {
      throw new Error(`No se pudo analizar la reunión con la IA: ${(error as Error).message}`);
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error(
        "La IA no devolvió una respuesta con la estructura esperada. No se generó ningún ticket.",
      );
    }

    return parsed.tickets.map((ticket) => {
      const usedImageIndices = ticket.sections.flatMap((section) => section.imageIndices);
      // El bloque de origen de una imagen usada se congela junto con el
      // resto — lo calcula la app, no depende de que la IA lo liste.
      const imageSourceBlockIndices = usedImageIndices
        .map((imageIndex) => imageBlockIndices[imageIndex])
        .filter((blockIndex): blockIndex is number => blockIndex !== undefined);

      return {
        ticketId: randomUUID(),
        subject: ticket.subject,
        sections: ticket.sections.map((section) => ({
          description: section.description,
          imageSrcs: section.imageIndices
            .map((index) => imageSrcs[index])
            .filter((src): src is string => !!src),
        })),
        assigneeId: ticket.assigneeId ?? undefined,
        assigneeName: ticket.assigneeName ?? undefined,
        responsibleId: responsible?.id,
        responsibleName: responsible?.name,
        dueDate: ticket.dueDate ?? undefined,
        estimatedHours: ticket.estimatedHours ?? undefined,
        sourceBlockIndices: [
          ...new Set([...ticket.sourceBlockIndices, ...imageSourceBlockIndices]),
        ],
      };
    });
  }
}

/**
 * Reemplaza cada nodo de imagen por `{ type: "image", attrs: { imageIndex } }`,
 * devolviendo aparte las URLs de origen. A Claude nunca le llegan URLs
 * firmadas ni base64 — solo necesita saber DÓNDE hay una imagen.
 * `imageBlockIndices[imageIndex]` es el `blockIndex` del bloque de nivel
 * superior que ESA imagen es, lo que permite congelarlo con su ticket.
 */
function extractImages(document: MeetingDocument): {
  imageSrcs: string[];
  imageBlockIndices: number[];
  sanitizedDocument: MeetingDocument;
} {
  const imageSrcs: string[] = [];
  const imageBlockIndices: number[] = [];

  function walk(node: JSONContent): JSONContent {
    if (node.type === "image" && typeof node.attrs?.src === "string") {
      const imageIndex = imageSrcs.length;
      imageSrcs.push(node.attrs.src);
      imageBlockIndices.push(node.attrs.blockIndex as number);
      return { type: "image", attrs: { imageIndex } };
    }
    if (!node.content) return node;
    return { ...node, content: node.content.map(walk) };
  }

  return { imageSrcs, imageBlockIndices, sanitizedDocument: walk(document) as MeetingDocument };
}
