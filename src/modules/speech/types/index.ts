/**
 * Tipos del Web Speech API (reconocimiento de voz nativo del navegador).
 * TypeScript ya incluye `SpeechRecognitionResult`/`SpeechRecognitionResultList`/
 * `SpeechRecognitionAlternative` en `lib.dom.d.ts`, pero NO la interfaz
 * `SpeechRecognition` en sí, sus eventos, ni las propiedades `SpeechRecognition`/
 * `webkitSpeechRecognition` de `Window` — se declaran aquí porque son la forma
 * real de la API nativa (Chrome/Edge/Brave), no un polyfill.
 */

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Motivo de error ya normalizado — los consumidores nunca ven el string
 * crudo del navegador. "network" es un caso real y distinto (no
 * "desconocido"): el reconocimiento de voz de Chrome/Edge/Brave depende de
 * un backend de Google al que el navegador no logró conectarse — típico en
 * Brave (elimina las API keys que Chromium usa para ese backend) o sin
 * conexión a internet.
 */
export type SpeechRecognitionErrorReason =
  "permission-denied" | "unsupported" | "no-speech" | "network" | "unknown";
