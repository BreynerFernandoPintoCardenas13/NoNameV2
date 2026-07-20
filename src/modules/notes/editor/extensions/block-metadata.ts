import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { createMetadataContainer } from "@/modules/notes/editor/metadata/metadata-container";
import type { MetadataItem, MetadataRegistry } from "@/modules/notes/editor/metadata/types";

const METADATA_NODE_TYPES = ["paragraph", "heading"];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockMetadata: {
      /** Inserta o reemplaza (por `type`) un metadato del bloque donde está el cursor, preservando el orden. */
      setBlockMetadataItem: (item: MetadataItem) => ReturnType;
    };
  }
}

/**
 * Adjunta un atributo `metadata` (array ordenado de `MetadataItem`) a los
 * tipos de bloque en `METADATA_NODE_TYPES` vía `addGlobalAttributes`. El
 * atributo viaja dentro del JSON del documento como cualquier otro. Es un
 * array (no un objeto) porque el orden de los chips es en sí mismo un dato.
 *
 * Los chips se dibujan con una decoración de ProseMirror (`Decoration.widget`)
 * que monta un contenedor DOM puro — capa de presentación recalculada en
 * cada render, nunca parte del documento. La extensión no sabe qué es
 * "assignee": solo conoce el `MetadataRegistry` inyectado por la app.
 * Portada de NoNameV1 sin cambios de comportamiento.
 */
export const BlockMetadataExtension = Extension.create<{ registry: MetadataRegistry }>({
  name: "blockMetadata",

  addOptions() {
    return { registry: {} };
  },

  addGlobalAttributes() {
    return [
      {
        types: METADATA_NODE_TYPES,
        attributes: {
          metadata: {
            default: null,
            // Sin esto, Tiptap copiaría el atributo al nodo nuevo cada vez
            // que Enter parte el bloque. No es la única defensa (ver
            // addKeyboardShortcuts), pero documenta la intención.
            keepOnSplit: false,
            parseHTML: (element) => {
              const raw = element.getAttribute("data-metadata");
              return raw ? JSON.parse(raw) : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.metadata) return {};
              return { "data-metadata": JSON.stringify(attributes.metadata) };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setBlockMetadataItem:
        (item) =>
        ({ state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (METADATA_NODE_TYPES.includes(node.type.name)) {
              if (dispatch) {
                const pos = $from.before(depth);
                const current = (node.attrs.metadata as MetadataItem[] | null) ?? [];
                const index = current.findIndex((existing) => existing.type === item.type);
                const next =
                  index === -1
                    ? [...current, item]
                    : current.map((existing, i) => (i === index ? item : existing));
                dispatch(state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, metadata: next }));
              }
              return true;
            }
          }
          return false;
        },
    };
  },

  /**
   * `keepOnSplit: false` no cubre todas las rutas del `splitBlock` interno
   * (hay una que copia `node.attrs` sin filtrar). Se intercepta Enter
   * explícitamente: solo cuando el bloque actual tiene metadato se hace el
   * split normal y se limpia el metadato del bloque nuevo; si no hay
   * metadato, `false` deja el Enter normal (listas, código...) intacto.
   */
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        const atTopLevel =
          $from.depth === 1 && METADATA_NODE_TYPES.includes($from.node(1).type.name);
        const metadata = atTopLevel
          ? ($from.node(1).attrs.metadata as MetadataItem[] | null)
          : null;
        if (!atTopLevel || !metadata || metadata.length === 0) {
          return false;
        }

        const didSplit = editor.commands.splitBlock();
        if (didSplit) {
          const { $from: $after } = editor.state.selection;
          if ($after.depth === 1 && METADATA_NODE_TYPES.includes($after.node(1).type.name)) {
            const pos = $after.before(1);
            const node = $after.node(1);
            editor.view.dispatch(
              editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, metadata: null }),
            );
          }
        }
        return didSplit;
      },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const registry = this.options.registry;

    /** El usuario hizo clic (no arrastró) un chip: mover el cursor a su bloque y avisarle al tipo. */
    function handleChipClick(item: MetadataItem, blockPos: number) {
      editor.commands.setTextSelection(blockPos + 1);
      registry[item.type]?.onClick({ blockPos, item });
    }

    /** El usuario terminó de arrastrar: persistir el nuevo orden en el atributo del bloque. */
    function handleReorder(blockPos: number, order: MetadataItem[]) {
      const node = editor.state.doc.nodeAt(blockPos);
      if (!node) return;
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(blockPos, undefined, { ...node.attrs, metadata: order }),
      );
    }

    return [
      new Plugin({
        key: new PluginKey("blockMetadataDecorations"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              const metadata = (node.attrs.metadata as MetadataItem[] | null) ?? [];
              if (METADATA_NODE_TYPES.includes(node.type.name) && metadata.length > 0) {
                decorations.push(
                  Decoration.widget(
                    pos,
                    () =>
                      createMetadataContainer({
                        items: metadata,
                        registry,
                        blockPos: pos,
                        onReorder: (order) => handleReorder(pos, order),
                        onChipClick: (item) => handleChipClick(item, pos),
                      }),
                    { side: -1 },
                  ),
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
