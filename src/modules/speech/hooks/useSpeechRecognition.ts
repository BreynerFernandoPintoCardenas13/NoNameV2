"use client";

import * as React from "react";

import { logger } from "@/lib/logger";
import {
  createSpeechRecognition,
  DEFAULT_SPEECH_LANGUAGE,
  isSpeechRecognitionSupported,
} from "@/modules/speech/services/speech.service";
import type { SpeechRecognition, SpeechRecognitionErrorReason } from "@/modules/speech/types";

interface UseSpeechRecognitionOptions {
  /** Idioma BCP-47, ej. "es-CO". */
  lang?: string;
}

/**
 * Reconocimiento de voz corto (dictado) sobre la Web Speech API nativa del
 * navegador — sin IA, sin subir audio a ningún servidor, sin dependencias
 * nuevas. Expone únicamente lo que cualquier consumidor necesita para
 * dictar un campo de texto (ticket, comentario, tarea, nota…); no sabe nada
 * de editores, modales ni toasts — esa capa vive en quien use el hook.
 */
export function useSpeechRecognition({
  lang = DEFAULT_SPEECH_LANGUAGE,
}: UseSpeechRecognitionOptions = {}) {
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = React.useRef("");
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<SpeechRecognitionErrorReason | null>(null);

  const supported = React.useMemo(() => isSpeechRecognitionSupported(), []);

  const stop = React.useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = React.useCallback(() => {
    const recognition = createSpeechRecognition(lang);
    if (!recognition) {
      setError("unsupported");
      return;
    }

    setError(null);
    finalTranscriptRef.current = "";
    setTranscript("");

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalTranscriptRef.current += `${text} `;
        else interim += text;
      }
      setTranscript(`${finalTranscriptRef.current}${interim}`.trim());
    };

    recognition.onerror = (event) => {
      // El código crudo del navegador nunca llega al consumidor (ver
      // SpeechRecognitionErrorReason), pero queda en consola para poder
      // diagnosticar sin adivinar — "network"/"audio-capture"/"aborted" son
      // casos reales distintos de "no compatible" o "permiso denegado".
      logger.error("SpeechRecognition error:", event.error, event.message);
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setError("permission-denied");
      } else if (event.error === "no-speech") {
        setError("no-speech");
      } else if (event.error === "network") {
        setError("network");
      } else {
        setError("unknown");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (startError) {
      logger.error("SpeechRecognition failed to start:", startError);
      setError("unknown");
    }
  }, [lang]);

  // Nunca dejar el micrófono escuchando si el componente se desmonta a mitad de reconocimiento.
  React.useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { start, stop, isListening, transcript, error, supported };
}
