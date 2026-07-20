"use client";

import type { Editor } from "@tiptap/core";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Descarga el JSON nativo de la nota (`editor.getJSON()`) — la misma
 * estructura que recibe la IA. Portado del botón "Descargar notas" de V1.
 */
export function ExportNoteButton({ editor }: { editor: Editor | null }) {
  const download = () => {
    if (!editor) return;
    const json = JSON.stringify(editor.getJSON(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `notas-reunion-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Descargar notas en JSON"
      onClick={download}
      disabled={!editor}
    >
      <Download />
    </Button>
  );
}
