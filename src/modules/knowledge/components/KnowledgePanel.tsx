"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  getOrCreateKnowledge,
  updateKnowledge,
} from "@/modules/knowledge/services/knowledge.service";

import "@/modules/notes/editor/editor.css";

const PANEL_OPEN_STORAGE_KEY = "nn:knowledgePanelOpen";
const AUTOSAVE_DEBOUNCE_MS = 600;

// Mini-store sobre localStorage (useSyncExternalStore): SSR-safe y sin
// setState dentro de effects.
const panelListeners = new Set<() => void>();
const subscribePanel = (listener: () => void) => {
  panelListeners.add(listener);
  return () => panelListeners.delete(listener);
};
const readPanelOpen = () => window.localStorage.getItem(PANEL_OPEN_STORAGE_KEY) === "true";
const writePanelOpen = (open: boolean) => {
  window.localStorage.setItem(PANEL_OPEN_STORAGE_KEY, String(open));
  panelListeners.forEach((listener) => listener());
};

/**
 * Panel lateral de Base de Conocimiento (portado de V1): editor Tiptap
 * independiente del de notas — mismas capacidades básicas pero SIN
 * metadatos ni tracking de tickets. Estado abierto/cerrado persistido en
 * localStorage, autoguardado con el mismo debounce de 600 ms.
 */
export function KnowledgePanel({ projectId }: { projectId: string }) {
  const open = React.useSyncExternalStore(subscribePanel, readPanelOpen, () => false);
  const toggle = writePanelOpen;

  return (
    <>
      {!open && (
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Abrir base de conocimiento"
          className="fixed right-4 bottom-4 z-30 rounded-full"
          onClick={() => toggle(true)}
        >
          <BookOpen />
        </Button>
      )}

      {open && (
        <aside
          aria-label="Base de conocimiento del proyecto"
          className="border-border/60 bg-background flex w-80 shrink-0 flex-col border-l"
        >
          <div className="border-border/60 flex items-center gap-2 border-b px-4 py-2.5">
            <BookOpen className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium">Base de conocimiento</span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Cerrar base de conocimiento"
              onClick={() => toggle(false)}
            >
              <X />
            </Button>
          </div>
          <KnowledgeEditor key={projectId} projectId={projectId} />
        </aside>
      )}
    </>
  );
}

function KnowledgeEditor({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["knowledge", projectId],
    queryFn: () => getOrCreateKnowledge(projectId),
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" aria-label="Cargando" />
      </div>
    );
  }

  return <KnowledgeEditorInner projectId={projectId} initialDocument={data.document} />;
}

function KnowledgeEditorInner({
  projectId,
  initialDocument,
}: {
  projectId: string;
  initialDocument: object;
}) {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: "Escribe aquí información permanente del proyecto…" }),
    ],
    content: initialDocument,
    onUpdate: ({ editor }) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        void updateKnowledge(projectId, editor.getJSON());
      }, AUTOSAVE_DEBOUNCE_MS);
    },
  });

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div className="note-editor flex-1 overflow-y-auto p-4">
      <EditorContent editor={editor} />
    </div>
  );
}
