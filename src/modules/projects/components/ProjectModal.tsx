"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from "@/components/shared/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectMutations } from "@/modules/projects/hooks/useProjects";
import {
  projectFormSchema,
  type ProjectFormInput,
} from "@/modules/projects/schemas/project.schemas";
import type { LocalProject, LocalProjectInput } from "@/modules/projects/types";
import {
  MissingApiKeyError,
  useOpenProjectBoardColumns,
  useOpenProjectBoards,
  useOpenProjectProjects,
} from "@/modules/openproject/hooks/useOpenProjectData";
import { ManagersTab } from "@/modules/projects/components/ManagersTab";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = crear; un proyecto = editar (habilita la pestaña Encargados). */
  project: LocalProject | null;
  /** Abre Configuración cuando el usuario aún no tiene API Key. */
  onOpenSettings: () => void;
}

const NONE = "none";

/**
 * Modal Crear/Editar Proyecto — réplica del de V1: nombre + proyecto real de
 * OpenProject + tablero y columna opcionales (selects en cascada), y pestaña
 * de Encargados al editar.
 */
export function ProjectModal({ open, onOpenChange, project, onOpenSettings }: ProjectModalProps) {
  const { create, update } = useProjectMutations();

  const form = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", openProjectId: "", boardId: NONE, boardListId: NONE },
  });

  // Al abrir, precargar los valores del proyecto en edición.
  React.useEffect(() => {
    if (!open) return;
    form.reset({
      name: project?.name ?? "",
      openProjectId: project ? String(project.openProjectId) : "",
      boardId: project?.boardId ? String(project.boardId) : NONE,
      boardListId: project?.boardListId ? String(project.boardListId) : NONE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset solo al abrir/cambiar de proyecto
  }, [open, project?.id]);

  const opProjects = useOpenProjectProjects(open);
  const selectedOpId = useWatch({ control: form.control, name: "openProjectId" });
  const selectedBoardId = useWatch({ control: form.control, name: "boardId" });
  const boards = useOpenProjectBoards(selectedOpId ? Number(selectedOpId) : null);
  const columns = useOpenProjectBoardColumns(
    selectedBoardId && selectedBoardId !== NONE ? Number(selectedBoardId) : null,
  );

  const missingApiKey = opProjects.error instanceof MissingApiKeyError;

  const onSubmit = (values: ProjectFormInput) => {
    const opProject = opProjects.data?.find((p) => String(p.id) === values.openProjectId);
    if (!opProject) {
      toast.error("Selecciona un proyecto de OpenProject.");
      return;
    }
    const board = boards.data?.find((b) => String(b.id) === values.boardId);
    const column = columns.data?.find((c) => String(c.queryId) === values.boardListId);

    const input: LocalProjectInput = {
      name: values.name,
      openProjectId: opProject.id,
      openProjectName: opProject.name,
      ...(board ? { boardId: board.id, boardName: board.name } : {}),
      ...(board && column ? { boardListId: column.queryId, boardListName: column.name } : {}),
    };

    const mutation = project
      ? update.mutateAsync({ id: project.id, input })
      : create.mutateAsync(input);
    mutation
      .then(() => {
        toast.success(project ? "Proyecto actualizado" : "Proyecto creado");
        onOpenChange(false);
      })
      .catch((error: Error) => toast.error(error.message));
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del proyecto</FormLabel>
              <FormControl>
                <Input placeholder="Mi proyecto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {missingApiKey ? (
          <div className="border-border/60 flex flex-col items-start gap-2 rounded-lg border border-dashed p-3 text-sm">
            <p className="text-muted-foreground">
              Configura tu API Key de OpenProject para vincular un proyecto real.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onOpenSettings}>
              Abrir Configuración
            </Button>
          </div>
        ) : (
          <>
            <FormField
              control={form.control}
              name="openProjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto de OpenProject</FormLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => {
                      field.onChange(value ?? "");
                      form.setValue("boardId", NONE);
                      form.setValue("boardListId", NONE);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={opProjects.isLoading ? "Cargando…" : "Selecciona"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {opProjects.data?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedOpId && (
              <FormField
                control={form.control}
                name="boardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tablero (opcional)</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(value) => {
                        field.onChange(value ?? NONE);
                        form.setValue("boardListId", NONE);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={boards.isLoading ? "Cargando…" : "Sin tablero"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Sin tablero</SelectItem>
                        {boards.data?.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            {selectedBoardId && selectedBoardId !== NONE && (
              <FormField
                control={form.control}
                name="boardListId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Columna inicial</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v ?? NONE)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={columns.isLoading ? "Cargando…" : "Selecciona"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Primera columna</SelectItem>
                        {columns.data?.map((c) => (
                          <SelectItem key={c.queryId} value={String(c.queryId)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending || update.isPending || missingApiKey}>
            {(create.isPending || update.isPending) && (
              <Loader2 className="animate-spin" aria-hidden="true" />
            )}
            {project ? "Guardar cambios" : "Crear proyecto"}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Editar proyecto" : "Crear proyecto"}</DialogTitle>
        </DialogHeader>

        {project ? (
          <Tabs defaultValue="datos">
            <TabsList className="w-full">
              <TabsTrigger value="datos">Datos</TabsTrigger>
              <TabsTrigger value="encargados">Encargados</TabsTrigger>
            </TabsList>
            <TabsContents>
              <TabsContent value="datos">{formContent}</TabsContent>
              <TabsContent value="encargados">
                <ManagersTab projectId={project.id} />
              </TabsContent>
            </TabsContents>
          </Tabs>
        ) : (
          formContent
        )}
      </DialogContent>
    </Dialog>
  );
}
