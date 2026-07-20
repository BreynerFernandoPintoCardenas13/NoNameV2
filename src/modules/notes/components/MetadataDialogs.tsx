"use client";

import type { Editor } from "@tiptap/core";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignableUsers } from "@/modules/openproject/hooks/useOpenProjectData";

/** Cuál de los tres modales de metadato está abierto. */
export type MetadataDialogKind = "assignee" | "estimatedTime" | "dueDate" | null;

interface MetadataDialogsProps {
  editor: Editor | null;
  kind: MetadataDialogKind;
  onClose: () => void;
  /** Proyecto de OpenProject vinculado (para listar usuarios asignables). */
  openProjectId: number | null;
}

/**
 * Modales de "Asignado a", "Tiempo de trabajo" y "Fecha límite". Aplican el
 * metadato al bloque del cursor con `setBlockMetadataItem` — la misma
 * semántica de V1 (el chip clickeado ya movió la selección a su bloque).
 * La transacción resultante dispara "update" en el editor, que ya programa
 * el autoguardado. El cuerpo de cada modal se monta solo mientras está
 * abierto: su estado nace limpio en cada apertura, sin resets en effects.
 */
export function MetadataDialogs({ editor, kind, onClose, openProjectId }: MetadataDialogsProps) {
  const apply = (item: Record<string, unknown> & { type: string }) => {
    if (!editor) return;
    editor.chain().focus().setBlockMetadataItem(item).run();
    onClose();
  };

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {kind === "assignee" && (
          <AssigneeBody
            openProjectId={openProjectId}
            onCancel={onClose}
            onPick={(id, name) => apply({ type: "assignee", id, name })}
          />
        )}
        {kind === "estimatedTime" && (
          <TimeBody
            onCancel={onClose}
            onPick={(value) => apply({ type: "estimatedTime", value })}
          />
        )}
        {kind === "dueDate" && (
          <DateBody onCancel={onClose} onPick={(value) => apply({ type: "dueDate", value })} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssigneeBody({
  openProjectId,
  onCancel,
  onPick,
}: {
  openProjectId: number | null;
  onCancel: () => void;
  onPick: (id: number, name: string) => void;
}) {
  const users = useAssignableUsers(openProjectId);
  const [selected, setSelected] = React.useState<string | null>(null);

  const confirm = () => {
    const user = users.data?.find((u) => String(u.id) === selected);
    if (!user) {
      toast.error("Selecciona un usuario.");
      return;
    }
    onPick(user.id, user.name);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Asignado a</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        {users.isLoading ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Cargando usuarios del proyecto…
          </p>
        ) : users.isError ? (
          <p role="alert" className="text-destructive text-sm">
            No se pudo cargar el listado de usuarios.
          </p>
        ) : (
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Busca un usuario del proyecto…" />
            </SelectTrigger>
            <SelectContent>
              {users.data?.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!selected}>
            Asignar
          </Button>
        </div>
      </div>
    </>
  );
}

function TimeBody({ onCancel, onPick }: { onCancel: () => void; onPick: (hours: number) => void }) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState("");

  const confirm = () => {
    const hours = Number(value);
    if (!value.trim() || Number.isNaN(hours) || hours < 0) {
      setError("Ingresa un número de horas válido (ej. 1, 0.5, 2.25).");
      return;
    }
    onPick(hours);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tiempo de trabajo</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 py-2">
        <Label htmlFor="metadata-time">Horas estimadas</Label>
        <Input
          id="metadata-time"
          type="number"
          min={0}
          step={0.25}
          placeholder="Ej. 2.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
          autoFocus
        />
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={confirm}>Fijar tiempo</Button>
        </div>
      </div>
    </>
  );
}

function DateBody({ onCancel, onPick }: { onCancel: () => void; onPick: (date: string) => void }) {
  const [value, setValue] = React.useState("");

  const confirm = () => {
    // <input type="date"> ya produce exactamente YYYY-MM-DD — el formato que
    // espera `dueDate` en OpenProject, sin conversión intermedia.
    if (!value) {
      toast.error("Selecciona una fecha.");
      return;
    }
    onPick(value);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Fecha límite</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 py-2">
        <Label htmlFor="metadata-date">Fecha</Label>
        <Input
          id="metadata-date"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={confirm}>Fijar fecha</Button>
        </div>
      </div>
    </>
  );
}
