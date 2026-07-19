import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas con Zod.
 * Importar `env` desde aquí en lugar de leer `process.env` directamente.
 * Solo para uso en el servidor (Server Components, Route Handlers, services).
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENPROJECT_BASE_URL: z.url(),
  OPENPROJECT_API_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (!cached) {
    cached = serverEnvSchema.parse(process.env);
  }
  return cached;
}
