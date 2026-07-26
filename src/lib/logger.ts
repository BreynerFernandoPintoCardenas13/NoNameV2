/**
 * Punto único de logging. Hoy delega a `console`; el día que se integre
 * Sentry o Better Stack, solo este archivo cambia — no los call-sites.
 * Funciona tanto en cliente como en servidor.
 */
export const logger = {
  error(message: string, ...details: unknown[]) {
    console.error(message, ...details);
  },
  warn(message: string, ...details: unknown[]) {
    console.warn(message, ...details);
  },
  info(message: string, ...details: unknown[]) {
    console.info(message, ...details);
  },
};
