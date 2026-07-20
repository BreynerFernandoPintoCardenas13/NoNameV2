"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useResponsibleUsers } from "@/modules/openproject/hooks/useOpenProjectData";
import { useSettingsMutations, useUserSettings } from "@/modules/settings/hooks/useUserSettings";
import type { LocalProject } from "@/modules/projects/types";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** El override de "Responsable" elige usuarios del proyecto activo (regla de V1). */
  activeProject: LocalProject | null;
}

/** Configuración del usuario: API Key de OpenProject y Responsable por defecto. */
export function SettingsDialog({ open, onOpenChange, activeProject }: SettingsDialogProps) {
  const settings = useUserSettings(open);
  const { saveKey, saveResponsible } = useSettingsMutations();
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const responsibles = useResponsibleUsers(
    open && settings.data?.defaultResponsible.overrideEnabled && activeProject
      ? activeProject.openProjectId
      : null,
  );

  const handleSaveKey = () => {
    const value = apiKey.trim();
    if (!value) {
      toast.error("Pega tu API Key de OpenProject.");
      return;
    }
    saveKey
      .mutateAsync(value)
      .then((result) => {
        setApiKey(""); // la key jamás permanece en estado del cliente
        if (result.warning) toast.warning(result.warning);
        else toast.success(`API Key verificada: ${result.opCurrentUser?.name}`);
      })
      .catch((error: Error) => toast.error(error.message));
  };

  const handleToggleOverride = (enabled: boolean) => {
    saveResponsible
      .mutateAsync({ overrideEnabled: enabled })
      .catch((error: Error) => toast.error(error.message));
  };

  const handlePickResponsible = (value: string | null) => {
    const user = responsibles.data?.find((u) => String(u.id) === value);
    if (!user) return;
    saveResponsible
      .mutateAsync({ overrideEnabled: true, userId: user.id, userName: user.name })
      .catch((error: Error) => toast.error(error.message));
  };

  const data = settings.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>

        {settings.isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : settings.isError ? (
          <p role="alert" className="text-destructive py-4 text-sm">
            {settings.error.message}
          </p>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            <section className="flex flex-col gap-2" aria-label="API Key de OpenProject">
              <Label htmlFor="settings-api-key">API Key de OpenProject</Label>
              <p className="text-muted-foreground text-xs">
                {data?.hasApiKey
                  ? data.opCurrentUser
                    ? `Configurada · autenticado como ${data.opCurrentUser.name} (${data.opCurrentUser.login})`
                    : "Configurada, pero sin verificar contra OpenProject."
                  : "Aún no configurada. Génerala en Mi cuenta → Tokens de API."}
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="settings-api-key"
                    type={showKey ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={data?.hasApiKey ? "Reemplazar API Key…" : "Pega tu API Key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? "Ocultar API Key" : "Mostrar API Key"}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                  >
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button onClick={handleSaveKey} disabled={saveKey.isPending}>
                  {saveKey.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Guardar
                </Button>
              </div>
            </section>

            <section className="flex flex-col gap-3" aria-label="Responsable por defecto">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="settings-override">Responsable fijo para los tickets</Label>
                  <p className="text-muted-foreground text-xs">
                    Apagado: el responsable eres tú (según tu API Key).
                  </p>
                </div>
                <Switch
                  id="settings-override"
                  checked={data?.defaultResponsible.overrideEnabled ?? false}
                  onCheckedChange={handleToggleOverride}
                  disabled={saveResponsible.isPending}
                />
              </div>

              {data?.defaultResponsible.overrideEnabled && (
                <div className="flex flex-col gap-1.5">
                  {activeProject ? (
                    <Select
                      value={
                        data.defaultResponsible.userId !== null
                          ? String(data.defaultResponsible.userId)
                          : null
                      }
                      onValueChange={handlePickResponsible}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            responsibles.isLoading ? "Cargando usuarios…" : "Elige un responsable"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {responsibles.data?.map((user) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Abre un proyecto en la sidebar para elegir entre sus usuarios.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
