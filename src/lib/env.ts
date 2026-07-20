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

/**
 * Env del servidor específica de autenticación (Supabase). Separada de `env()`
 * para que el módulo auth no exija tener configuradas las claves de IA/OpenProject.
 * La service role key es SOLO de servidor: jamás debe llevar prefijo NEXT_PUBLIC.
 */
const authServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type AuthServerEnv = z.infer<typeof authServerEnvSchema>;

let authCached: AuthServerEnv | null = null;

export function authServerEnv(): AuthServerEnv {
  if (!authCached) {
    authCached = authServerEnvSchema.parse(process.env);
  }
  return authCached;
}
