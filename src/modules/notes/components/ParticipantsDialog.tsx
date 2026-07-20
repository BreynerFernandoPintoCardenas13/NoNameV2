"use client";

import { Loader2, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MeetingParticipant } from "@/modules/notes/editor/extensions/meeting-block";
import { useManagers } from "@/modules/projects/hooks/useManagers";

export interface ParticipantsDialogState {
  current: MeetingParticipant[];
  onSave: (participants: MeetingParticipant[]) => void;
}

interface ParticipantsDialogProps {
  state: ParticipantsDialogState | null;
  onClose: () => void;
  projectId: string;
}

/**
 * Modal de participantes del bloque de Reunión (portado de V1): dos fuentes
 * de personas unificadas en un solo `MeetingParticipant[]` al guardar —
 * los Encargados del proyecto (consultados en cada apertura) e invitados
 * externos capturados a mano, que solo existen dentro de esta reunión.
 */
export function ParticipantsDialog({ state, onClose, projectId }: ParticipantsDialogProps) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {state && <ParticipantsBody state={state} onClose={onClose} projectId={projectId} />}
      </DialogContent>
    </Dialog>
  );
}

function ParticipantsBody({
  state,
  onClose,
  projectId,
}: {
  state: ParticipantsDialogState;
  onClose: () => void;
  projectId: string;
}) {
  const managers = useManagers(projectId);
  const [selectedManagerIds, setSelectedManagerIds] = React.useState<Set<string>>(
    () => new Set(state.current.filter((p) => p.type === "PROJECT_MANAGER").map((p) => p.id)),
  );
  const [external, setExternal] = React.useState<MeetingParticipant[]>(() =>
    state.current.filter((p) => p.type === "EXTERNAL"),
  );
  const [showGuestForm, setShowGuestForm] = React.useState(false);
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [error, setError] = React.useState("");

  const toggleManager = (id: string, checked: boolean) => {
    setSelectedManagerIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const addGuest = () => {
    const name = guestName.trim();
    const email = guestEmail.trim();
    if (!name || !email) {
      setError("Nombre y correo son obligatorios para un invitado externo.");
      return;
    }
    setError("");
    setExternal((prev) => [...prev, { id: crypto.randomUUID(), name, email, type: "EXTERNAL" }]);
    setGuestName("");
    setGuestEmail("");
    setShowGuestForm(false);
  };

  const save = () => {
    const selectedManagers: MeetingParticipant[] = (managers.data ?? [])
      .filter((manager) => selectedManagerIds.has(manager.id))
      .map((manager) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        type: "PROJECT_MANAGER" as const,
      }));
    state.onSave([...selectedManagers, ...external]);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Participantes de la reunión</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-5 py-2">
        <section className="flex flex-col gap-2" aria-label="Encargados del proyecto">
          <p className="text-muted-foreground text-xs font-medium">Encargados del proyecto</p>
          {managers.isLoading ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Cargando…
            </p>
          ) : managers.data?.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Este proyecto no tiene encargados registrados.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {managers.data?.map((manager) => (
                <li key={manager.id}>
                  <Label className="flex items-center gap-2 text-sm font-normal">
                    <Checkbox
                      checked={selectedManagerIds.has(manager.id)}
                      onCheckedChange={(checked) => toggleManager(manager.id, checked === true)}
                    />
                    {manager.name}
                  </Label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2" aria-label="Invitados externos">
          <p className="text-muted-foreground text-xs font-medium">Invitados externos</p>
          {external.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {external.map((guest, index) => (
                <li
                  key={guest.id}
                  className="border-border/60 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {guest.name} <span className="text-muted-foreground">({guest.email})</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Quitar a ${guest.name}`}
                    onClick={() => setExternal((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {showGuestForm ? (
            <div className="border-border/60 flex flex-col gap-2 rounded-lg border p-3">
              <Input
                placeholder="Nombre"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                aria-label="Nombre del invitado"
              />
              <Input
                type="email"
                placeholder="Correo"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                aria-label="Correo del invitado"
              />
              {error && (
                <p role="alert" className="text-destructive text-xs">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowGuestForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={addGuest}>
                  Agregar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setShowGuestForm(true)}
            >
              + Invitado externo
            </Button>
          )}
        </section>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar participantes</Button>
        </div>
      </div>
    </>
  );
}
