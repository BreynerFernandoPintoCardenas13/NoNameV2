"use client";

import * as React from "react";
import {
  FileText as FileTextIcon,
  Folder as FolderClosedIcon,
  FolderOpen as FolderOpenIcon,
} from "lucide-react";

import {
  File as FilePrimitive,
  FileHighlight,
  FileIcon,
  FileLabel,
  Files as FilesPrimitive,
  FilesHighlight,
  Folder as FolderPrimitive,
  FolderContent,
  FolderHeader,
  FolderHighlight,
  FolderIcon,
  FolderItem,
  FolderTrigger,
} from "@/components/animate-ui/primitives/radix/files";
import { cn } from "@/lib/utils";

export type FileTreeNode =
  | { type: "folder"; id: string; label: string; children: FileTreeNode[] }
  | { type: "file"; id: string; label: string };

type FileTreeProps = {
  data: FileTreeNode[];
  defaultOpen?: string[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * Explorador jerárquico (carpetas expandibles + líneas guía + resaltado al hover y al
 * seleccionar). Base pensada para representar proyectos → subcarpetas → notas en
 * NoName V2: cada nodo solo necesita {type, id, label, children?}.
 */
export function FileTree({
  data,
  defaultOpen = [],
  selectedId,
  onSelect,
  className,
}: FileTreeProps) {
  return (
    <FilesPrimitive
      className={cn("flex flex-col gap-0.5 p-2", className)}
      defaultOpen={defaultOpen}
    >
      <FilesHighlight className="bg-accent pointer-events-none rounded-md">
        <FileTreeNodes nodes={data} selectedId={selectedId} onSelect={onSelect} />
      </FilesHighlight>
    </FilesPrimitive>
  );
}

function FileTreeNodes({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: FileTreeNode[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) =>
        node.type === "folder" ? (
          <FolderItem key={node.id} value={node.id}>
            <FolderHeader>
              <FolderTrigger className="w-full text-start">
                <FolderHighlight>
                  <FolderPrimitive className="hover:bg-muted/50 pointer-events-none flex items-center gap-2 rounded-md px-2 py-1.5">
                    <FolderIcon
                      closeIcon={<FolderClosedIcon className="text-muted-foreground size-4" />}
                      openIcon={<FolderOpenIcon className="text-muted-foreground size-4" />}
                    />
                    <FileLabel className="text-sm font-medium">{node.label}</FileLabel>
                  </FolderPrimitive>
                </FolderHighlight>
              </FolderTrigger>
            </FolderHeader>

            <div className="border-border relative ml-4.5 border-l pl-3.5">
              <FolderContent>
                {node.children.length === 0 ? (
                  <p className="text-muted-foreground py-1.5 pl-2 text-xs italic">Vacía</p>
                ) : (
                  <FilesPrimitive defaultOpen={[]}>
                    <FilesHighlight className="bg-accent pointer-events-none rounded-md">
                      <FileTreeNodes
                        nodes={node.children}
                        selectedId={selectedId}
                        onSelect={onSelect}
                      />
                    </FilesHighlight>
                  </FilesPrimitive>
                )}
              </FolderContent>
            </div>
          </FolderItem>
        ) : (
          <FileHighlight
            key={node.id}
            value={node.id}
            onClick={() => onSelect?.(node.id)}
            className={cn("rounded-md", selectedId === node.id && "bg-muted")}
          >
            <FilePrimitive
              data-selected={selectedId === node.id}
              className="text-muted-foreground data-[selected=true]:text-foreground pointer-events-none flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
            >
              <FileIcon>
                <FileTextIcon className="size-4" />
              </FileIcon>
              <FileLabel className="text-sm">{node.label}</FileLabel>
            </FilePrimitive>
          </FileHighlight>
        ),
      )}
    </>
  );
}
