import type { SpeechRecognition } from "@/modules/speech/types";

/** Idioma por defecto para dictado — español de Colombia. */
export const DEFAULT_SPEECH_LANGUAGE = "es-CO";

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/** `true` si el navegador expone `SpeechRecognition` (Chrome/Edge/Brave) o su variante `webkit`. */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

/**
 * Crea una instancia lista para dictado corto (una idea hablada, no una
 * transcripción continua de reunión): `continuous` evita que se corte en la
 * primera pausa natural del habla; `interimResults` deja la puerta abierta a
 * mostrar avance en vivo si un futuro consumidor lo necesita. `null` si el
 * navegador no soporta la API — nunca lanza.
 */
export function createSpeechRecognition(
  lang: string = DEFAULT_SPEECH_LANGUAGE,
): SpeechRecognition | null {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) return null;

  const recognition = new Constructor();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}
