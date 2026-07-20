import { z } from "zod";

/**
 * Schemas de validación de autenticación. Única fuente de verdad:
 * los formularios (React Hook Form) y los route handlers los reutilizan.
 */

/** Solo letras, números, guion y guion bajo. Sin espacios, emojis ni HTML. */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(30, "Máximo 30 caracteres")
  .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, «_» y «-»");

/** z.email() valida sintaxis RFC 5322. */
export const emailSchema = z.email("Correo inválido").max(254, "Correo demasiado largo");

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const apiKeySchema = z
  .string()
  .trim()
  .min(10, "La API KEY parece demasiado corta")
  .max(200, "La API KEY parece demasiado larga")
  .regex(/^[\x21-\x7e]+$/, "La API KEY contiene caracteres inválidos");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerStepUsernameSchema = z.object({
  username: usernameSchema,
});
export type RegisterStepUsernameInput = z.infer<typeof registerStepUsernameSchema>;

export const registerStepEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterStepEmailInput = z.infer<typeof registerStepEmailSchema>;

export const registerStepApiKeySchema = z.object({
  apiKey: apiKeySchema,
});
export type RegisterStepApiKeyInput = z.infer<typeof registerStepApiKeySchema>;

/** Body del route handler de estado de verificación. */
export const verificationStatusSchema = z.object({
  authId: z.uuid(),
});
export type VerificationStatusInput = z.infer<typeof verificationStatusSchema>;
