/**
 * Un metadato de bloque. `type` identifica de cuál se trata ("assignee",
 * "estimatedTime", "dueDate" hoy); el resto de las claves son los datos
 * propios de ese tipo. Objeto abierto a propósito: un tipo nuevo no
 * necesita cambiar esta forma. Portado de V1.
 */
export interface MetadataItem {
  type: string;
  [key: string]: unknown;
}

/** Lo que recibe un tipo de metadato cuando el usuario hace clic en su chip. */
export interface MetadataClickContext {
  blockPos: number;
  item: MetadataItem;
}

/**
 * Cómo se ve y se comporta un tipo de metadato. Los componentes de chips no
 * conocen "assignee" ni ningún tipo en particular: solo consultan este
 * registro. Agregar un tipo nuevo es una entrada más aquí.
 */
export interface MetadataTypeDefinition {
  /** Emoji o símbolo corto que identifica el tipo (👤, ⏱, 📅, ...). */
  icon: string;
  /** Texto a mostrar en el chip a partir de los datos del item. */
  label(item: MetadataItem): string;
  /** Qué hacer cuando el usuario hace clic en un chip de este tipo (ej. reabrir su modal). */
  onClick(context: MetadataClickContext): void;
}

export type MetadataRegistry = Record<string, MetadataTypeDefinition>;
