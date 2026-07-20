import * as React from "react";

import {
  AlertDialog as AlertDialogPrimitive,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/animate-ui/primitives/radix/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlertDialogProps = React.ComponentProps<typeof AlertDialogPrimitive> & {
  title: string;
  description?: string;
  trigger?: React.ReactElement;
  cancelLabel?: string;
  actionLabel: string;
  destructive?: boolean;
  onConfirm?: () => void;
};

/**
 * Confirmación destructiva/crítica — a diferencia de Modal, siempre requiere una
 * decisión explícita (no cierra al hacer clic fuera) y su Action es la única
 * salida "positiva". Úsalo para eliminar/cerrar sesión, no para formularios.
 */
export function AlertDialog({
  title,
  description,
  trigger,
  cancelLabel = "Cancelar",
  actionLabel,
  destructive = false,
  onConfirm,
  ...props
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive {...props}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogPortal>
        <AlertDialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
        <AlertDialogContent
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 fixed top-1/2 left-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-4 text-sm ring-1",
          )}
        >
          <AlertDialogHeader className="flex flex-col gap-2">
            <AlertDialogTitle className="font-heading text-base leading-none font-medium">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-muted-foreground text-sm">
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end">
            <AlertDialogCancel asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
                {actionLabel}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogPrimitive>
  );
}
