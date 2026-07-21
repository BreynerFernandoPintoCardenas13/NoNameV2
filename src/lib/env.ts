import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas con Zod y separadas por
 * dominio: cada módulo exige solo lo que necesita (auth no requiere tener
 * configurado Anthropic, ni OpenProject a Supabase, etc.). Importar estas
 * funciones en lugar de leer `process.env` directamente. Solo servidor.
 */

function makeEnv<T extends z.ZodRawShape>(shape: T) {
  const schema = z.object(shape);
  let cached: z.infer<typeof schema> | null = null;
  return () => {
    if (!cached) cached = schema.parse(process.env);
    return cached;
  };
}

/** Supabase (service role). NUNCA exponer con prefijo NEXT_PUBLIC. */
export const authServerEnv = makeEnv({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

/** OpenProject: solo la URL base es de la app; la API Key es por usuario (tabla users). */
export const openProjectEnv = makeEnv({
  OPENPROJECT_BASE_URL: z.url().transform((url) => url.replace(/\/+$/, "")), // sin barra final, para concatenar rutas
});

/** Anthropic (Claude): credencial de la aplicación, una para todos los usuarios. */
export const aiEnv = makeEnv({
  ANTHROPIC_API_KEY: z.string().min(1),
});
