"use client";

import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Heading1, Heading2, Italic, List, ListOrdered } from "lucide-react";

import { cn } from "@/lib/utils";

/** Menú flotante de formato sobre la selección (H1/H2, negrita, cursiva, listas). */
export function EditorBubbleMenu({ editor }: { editor: Editor }) {
  const actions = [
    {
      icon: Heading1,
      label: "Título 1",
      isActive: () => editor.isActive("heading", { level: 1 }),
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      label: "Título 2",
      isActive: () => editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: Bold,
      label: "Negrita",
      isActive: () => editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Cursiva",
      isActive: () => editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: List,
      label: "Lista",
      isActive: () => editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Lista numerada",
      isActive: () => editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      className="bg-popover text-popover-foreground ring-foreground/10 flex items-center gap-0.5 rounded-lg p-1 shadow-lg ring-1"
    >
      {actions.map(({ icon: Icon, label, isActive, run }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={run}
          className={cn(
            "hover:bg-muted flex size-7 items-center justify-center rounded-md transition-colors",
            isActive() && "bg-muted",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </BubbleMenu>
  );
}
