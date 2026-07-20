import type { MetadataItem, MetadataRegistry, MetadataTypeDefinition } from "./types";

/**
 * Chips de metadatos de un bloque. DOM puro a propósito (portado de V1):
 * vive dentro de una decoración de ProseMirror, donde un widget imperativo
 * es el patrón natural — no sabe de Tiptap ni de React, solo avisa por
 * callback qué cambió (clic o nuevo orden).
 */

/** Un chip individual: ícono + etiqueta. Presentación pura. */
export function createMetadataChip(
  item: MetadataItem,
  definition: MetadataTypeDefinition | undefined,
): HTMLElement {
  const chip = document.createElement("span");
  chip.className = "metadata-chip";
  chip.dataset.type = item.type;

  const icon = document.createElement("span");
  icon.className = "metadata-chip-icon";
  icon.textContent = definition?.icon ?? "🔖";

  const label = document.createElement("span");
  label.className = "metadata-chip-label";
  label.textContent = definition?.label(item) ?? item.type;

  chip.append(icon, label);
  return chip;
}

export interface MetadataContainerOptions {
  items: MetadataItem[];
  registry: MetadataRegistry;
  /** Posición del bloque en el documento; solo se reenvía tal cual a los callbacks. */
  blockPos: number;
  onReorder(order: MetadataItem[]): void;
  onChipClick(item: MetadataItem, blockPos: number): void;
}

const DRAG_THRESHOLD_PX = 4;

/**
 * Fila de chips con reordenamiento por arrastre (Pointer Events nativos):
 * al superar un pequeño umbral tras el `pointerdown` se considera arrastre
 * en vez de clic, y el propio chip se reubica entre sus hermanos en el DOM
 * real — conserva su posición del puntero y sus listeners todo el gesto.
 */
export function createMetadataContainer(options: MetadataContainerOptions): HTMLElement {
  const { items, registry, blockPos, onReorder, onChipClick } = options;
  const itemByChip = new WeakMap<HTMLElement, MetadataItem>();

  const container = document.createElement("div");
  container.className = "metadata-container";

  for (const item of items) {
    const chip = createMetadataChip(item, registry[item.type]);
    itemByChip.set(chip, item);
    attachInteraction(chip);
    container.appendChild(chip);
  }

  function attachInteraction(chip: HTMLElement) {
    chip.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      // Sin esto, ProseMirror trata el pointerdown como un clic dentro del
      // contenido editable y mueve la selección ahí — eso dispara una
      // transacción, que recalcula TODAS las decoraciones (incluida esta
      // misma) y destruye a mitad de camino el chip que se está arrastrando.
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      let dragging = false;

      function onPointerMove(moveEvent: PointerEvent) {
        if (!dragging) {
          const moved = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
          if (moved < DRAG_THRESHOLD_PX) return;
          dragging = true;
          chip.classList.add("dragging");
        }

        const siblings = [...container.children].filter((el) => el !== chip) as HTMLElement[];
        const insertBefore = siblings.find((el) => {
          const rect = el.getBoundingClientRect();
          return moveEvent.clientX < rect.left + rect.width / 2;
        });
        container.insertBefore(chip, insertBefore ?? null);
      }

      function onPointerUp() {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);

        if (dragging) {
          chip.classList.remove("dragging");
          const newOrder = [...container.children].map((el) => itemByChip.get(el as HTMLElement)!);
          onReorder(newOrder);
        } else {
          onChipClick(itemByChip.get(chip)!, blockPos);
        }
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    });
  }

  return container;
}
