"use client";

import * as React from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { ScrollProgressBar } from "@/components/shared/scroll-progress";
import { cn } from "@/lib/utils";

const SAMPLE_CONTENT = `
  <h1>Kickoff — Rediseño de UI</h1>
  <p>Definimos el alcance del Design System: tema, cursor global, motion grid y pinned list. El editor de notas real (persistencia, sincronización con OpenProject) llega en un módulo posterior; esta vista es solo el shell visual.</p>
  <h2>Decisiones</h2>
  <p>El fondo pasa a negro/gris oscuro con blanco como color de interacción principal. Se elimina por completo la paleta naranja anterior.</p>
  <p>Todos los modales comparten un único componente base. Los formularios reutilizan los mismos campos (Input, Textarea, Select, Checkbox, Switch) con el mismo manejo de errores.</p>
  <h2>Pendientes</h2>
  <p>Conectar este editor a la persistencia real de notas cuando el módulo correspondiente esté listo. Por ahora sirve para validar tipografía, espaciado y la barra de progreso de scroll.</p>
  <p>Cuando el contenido de una nota es más largo que el alto visible del editor, como en este ejemplo, la barra de progreso de la parte superior indica cuánto se ha recorrido — sin sentirse como un elemento externo al editor.</p>
  <h2>Siguientes pasos</h2>
  <p>Diseñar el flujo de generación de tickets desde una nota. Explorar cómo se insertan imágenes dentro del contenido usando el componente ImagePreview del Design System.</p>
  <p>Revisar accesibilidad del editor: contraste de texto secundario, tamaños de foco visibles y navegación por teclado en la barra de herramientas futura.</p>
`;

type NoteEditorProps = {
  className?: string;
};

/**
 * Shell presentacional del futuro editor de notas — sin persistencia ni llamadas a
 * API/Prisma. Aloja la integración real de ScrollProgress: la barra aparece de forma
 * natural cuando el contenido excede el alto visible.
 */
export function NoteEditor({ className }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Escribe algo…" })],
    content: SAMPLE_CONTENT,
    immediatelyRender: false,
  });

  return (
    <div
      className={cn(
        "border-border bg-card flex h-[420px] flex-col overflow-hidden rounded-xl border",
        className,
      )}
    >
      <ScrollProgressBar containerClassName="px-8 py-6">
        <div
          className={cn(
            "max-w-none text-sm leading-relaxed",
            "[&_h1]:font-heading [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold",
            "[&_h2]:font-heading [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-medium",
            "[&_p]:text-muted-foreground [&_p]:mb-3",
          )}
        >
          <EditorContent editor={editor} className="focus:outline-none" />
        </div>
      </ScrollProgressBar>
    </div>
  );
}
