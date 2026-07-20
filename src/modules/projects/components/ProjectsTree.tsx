"use client";

import {
  ChevronRight,
  FilePlus2,
  FileText,
  Folder,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AlertDialog } from "@/components/shared/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNoteMutations, useNotes } from "@/modules/notes/hooks/useNotes";
import type { MeetingNoteSummary } from "@/modules/notes/types";
import { useProjectMutations, useProjects } from "@/modules/projects/hooks/useProjects";
import type { LocalProject } from "@/modules/projects/types";

interface ProjectsTreeProps {
  onEditProject: (project: LocalProject) => void;
  /** Notifica el proyecto activo (última fila tocada) para Configuración. */
  onActiveProjectChange: (project: LocalProject | null) => void;
}

/** Árbol Proyectos → Notas de la sidebar (carga perezosa de notas al expandir). */
export function ProjectsTree({ onEditProject, onActiveProjectChange }: ProjectsTreeProps) {
  const { data: projects, isLoading } = useProjects();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggle = (project: LocalProject) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) next.delete(project.id);
      else next.add(project.id);
      return next;
    });
    onActiveProjectChange(project);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-center text-xs">
        Aún no tienes proyectos. Crea el primero para empezar a tomar notas.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5 px-2">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          expanded={expanded.has(project.id)}
          onToggle={() => toggle(project)}
          onEdit={() => onEditProject(project)}
        />
      ))}
    </ul>
  );
}

function ProjectItem({
  project,
  expanded,
  onToggle,
  onEdit,
}: {
  project: LocalProject;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { rename, remove } = useProjectMutations();
  const notes = useNotes(project.id, expanded);
  const noteMutations = useNoteMutations(project.id);
  const [renaming, setRenaming] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const submitRename = (value: string) => {
    setRenaming(false);
    const name = value.trim();
    if (!name || name === project.name) return;
    rename.mutateAsync({ id: project.id, name }).catch((e: Error) => toast.error(e.message));
  };

  const createNote = () => {
    noteMutations.create
      .mutateAsync()
      .then((note) => router.push(`/dashboard/notes/${note.id}`))
      .catch((e: Error) => toast.error(e.message));
  };

  return (
    <li>
      <div className="group/project hover:bg-muted/60 flex items-center gap-1 rounded-lg px-1.5 py-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <ChevronRight
            className={cn(
              "text-muted-foreground size-3.5 shrink-0 transition-transform",
              expanded && "rotate-90",
            )}
            aria-hidden="true"
          />
          <Folder className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {renaming ? (
            <input
              autoFocus
              defaultValue={project.name}
              onBlur={(e) => submitRename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename(e.currentTarget.value);
                if (e.key === "Escape") setRenaming(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background w-full rounded border px-1 text-sm outline-none"
            />
          ) : (
            <span className="truncate text-sm">{project.name}</span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Nueva nota en ${project.name}`}
          className="opacity-0 group-hover/project:opacity-100"
          onClick={createNote}
        >
          {noteMutations.create.isPending ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Acciones de ${project.name}`}
                className="opacity-0 group-hover/project:opacity-100 aria-expanded:opacity-100"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil /> Editar proyecto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenaming(true)}>
              <Pencil /> Renombrar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <ul className="ml-5 flex flex-col gap-0.5 border-l pl-2">
          {notes.isLoading && <Skeleton className="my-1 h-6 w-full" />}
          {notes.data?.length === 0 && (
            <li className="text-muted-foreground px-2 py-1 text-xs">Sin notas todavía</li>
          )}
          {notes.data?.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              onDelete={(id) =>
                noteMutations.remove.mutateAsync(id).catch((e: Error) => toast.error(e.message))
              }
            />
          ))}
        </ul>
      )}

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar proyecto"
        description={`Se eliminará "${project.name}" con todas sus notas, encargados y base de conocimiento. Los tickets ya creados en OpenProject no se tocan.`}
        actionLabel="Eliminar"
        destructive
        onConfirm={() => {
          remove.mutateAsync(project.id).catch((e: Error) => toast.error(e.message));
          setConfirmDelete(false);
        }}
      />
    </li>
  );
}

function NoteRow({ note, onDelete }: { note: MeetingNoteSummary; onDelete: (id: string) => void }) {
  const router = useRouter();
  const params = useParams<{ noteId?: string }>();
  const isActive = params?.noteId === note.id;
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <li className="group/note flex items-center gap-1">
      <button
        type="button"
        onClick={() => router.push(`/dashboard/notes/${note.id}`)}
        className={cn(
          "hover:bg-muted/60 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left",
          isActive && "bg-muted",
        )}
      >
        <FileText className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        <span className={cn("truncate text-[13px]", !note.title && "text-muted-foreground italic")}>
          {note.title || "Sin título"}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Eliminar nota"
        className="opacity-0 group-hover/note:opacity-100"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 />
      </Button>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar nota"
        description={`Se eliminará "${note.title || "Sin título"}". Esta acción no se puede deshacer.`}
        actionLabel="Eliminar"
        destructive
        onConfirm={() => {
          onDelete(note.id);
          setConfirmDelete(false);
        }}
      />
    </li>
  );
}
