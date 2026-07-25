"use client";

import type { Editor } from "@tiptap/core";
import { Mic } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSpeechRecognition } from "@/modules/speech/hooks/useSpeechRecognition";
import type { SpeechRecognitionErrorReason } from "@/modules/speech/types";

interface DictateTicketDialogProps {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ERROR_MESSAGES: Record<SpeechRecognitionErrorReason, string> = {
  "permission-denied": "No fue posible acceder al micrófono.",
  unsupported: "Tu navegador no soporta reconocimiento de voz.",
  "no-speech": "No se detectó ningún texto.",
  network: "No se pudo conectar con el servicio de reconocimiento de voz. Verifica tu conexión.",
  unknown: "Ocurrió un error durante el reconocimiento.",
};

/**
 * "Dictar Ticket": el PM habla 5-20 segundos y el texto se agrega al final
 * de la nota, como si lo hubiera escrito a mano — mismo flujo de
 * autoguardado del editor, sin pantallas nuevas ni portapapeles. Solo UI:
 * toda la lógica de reconocimiento vive en `useSpeechRecognition`.
 */
export function DictateTicketDialog({ editor, open, onOpenChange }: DictateTicketDialogProps) {
  const { start, stop, isListening, transcript, error, supported } = useSpeechRecognition();
  const wasListeningRef = React.useRef(false);
  const stopRequestedRef = React.useRef(false);
  const startButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleStop = () => {
    stopRequestedRef.current = true;
    stop();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      stopRequestedRef.current = false;
      if (isListening) stop();
    }
    onOpenChange(next);
  };

  // El reconocimiento termina de forma asíncrona (tras "Detener" o solo):
  // recién cuando `isListening` pasa de true a false es seguro leer el
  // transcript final e insertarlo.
  React.useEffect(() => {
    if (wasListeningRef.current && !isListening) {
      if (stopRequestedRef.current && !error) {
        if (transcript) {
          editor
            ?.chain()
            .focus("end")
            .insertContent({ type: "paragraph", content: [{ type: "text", text: transcript }] })
            .run();
          toast.success("Ticket dictado correctamente");
          onOpenChange(false);
        } else {
          toast.info(ERROR_MESSAGES["no-speech"]);
        }
      }
      stopRequestedRef.current = false;
    }
    wasListeningRef.current = isListening;
  }, [isListening, error, transcript, editor, onOpenChange]);

  React.useEffect(() => {
    if (error) toast.error(ERROR_MESSAGES[error]);
  }, [error]);

  // Foco inicial en el botón principal, no en el botón de cerrar.
  React.useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => startButtonRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-black/60 backdrop-blur-md"
        className="max-w-sm border-none bg-[#0a0a0a] text-[#f7f7f7] ring-white/10"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#f7f7f7]">
            <Mic className="size-4" /> Dictar Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-3">
          {isListening ? (
            <>
              <span className="flex items-center gap-2 text-sm font-medium text-red-400">
                <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                Escuchando…
              </span>
              <ListeningIndicator />
              <Button
                variant="outline"
                onClick={handleStop}
                className="border-white/15 bg-white/5 text-[#f7f7f7] hover:bg-white/10"
              >
                Detener
              </Button>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-white/60">
                Presiona iniciar y describe el cambio.
              </p>
              <Button ref={startButtonRef} onClick={start} disabled={!supported}>
                <Mic /> Iniciar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Ondas sutiles mientras escucha — no un visualizador de audio real, solo indica actividad. */
function ListeningIndicator() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-red-400/80"
          style={{ height: 14 }}
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
