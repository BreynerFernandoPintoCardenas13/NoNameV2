"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { AlertDialog } from "@/components/shared/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useManagerMutations, useManagers } from "@/modules/projects/hooks/useManagers";
import {
  managerFormSchema,
  type ManagerFormInput,
} from "@/modules/projects/schemas/project.schemas";
import type { ProjectManager } from "@/modules/projects/types";

/**
 * Pestaña "Encargados" del modal de proyecto: lista + alta/edición inline +
 * eliminación con confirmación. Réplica funcional de la pestaña de V1.
 */
export function ManagersTab({ projectId }: { projectId: string }) {
  const { data: managers, isLoading } = useManagers(projectId);
  const { create, update, remove } = useManagerMutations(projectId);
  const [editing, setEditing] = React.useState<ProjectManager | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<ProjectManager | null>(null);

  const form = useForm<ManagerFormInput>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const openForm = (manager: ProjectManager | "new") => {
    setEditing(manager);
    form.reset(
      manager === "new"
        ? { name: "", email: "", phone: "" }
        : { name: manager.name, email: manager.email, phone: manager.phone ?? "" },
    );
  };

  const onSubmit = (values: ManagerFormInput) => {
    const input = {
      name: values.name,
      email: values.email,
      ...(values.phone ? { phone: values.phone } : {}),
    };
    const mutation =
      editing === "new"
        ? create.mutateAsync(input)
        : update.mutateAsync({ id: (editing as ProjectManager).id, input });
    mutation.then(() => setEditing(null)).catch((error: Error) => toast.error(error.message));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      {managers?.length === 0 && editing === null ? (
        <EmptyState
          icon={Users}
          title="Sin encargados"
          description="Agrega a las personas relacionadas con este proyecto."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {managers?.map((manager) => (
            <li
              key={manager.id}
              className="border-border/60 flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{manager.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {manager.email}
                  {manager.phone ? ` · ${manager.phone}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar a ${manager.name}`}
                onClick={() => openForm(manager)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar a ${manager.name}`}
                onClick={() => setDeleting(manager)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="border-border/60 flex flex-col gap-3 rounded-lg border p-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+57 ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) && (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                )}
                {editing === "new" ? "Agregar" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Button variant="outline" className="w-fit" onClick={() => openForm("new")}>
          <Plus /> Agregar encargado
        </Button>
      )}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar encargado"
        description={`Se eliminará a ${deleting?.name ?? ""} de este proyecto.`}
        actionLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          remove.mutateAsync(deleting.id).catch((error: Error) => toast.error(error.message));
          setDeleting(null);
        }}
      />
    </div>
  );
}
