import { z } from "zod";

/** Formulario Crear/Editar Proyecto — mismos campos obligatorios que V1. */
export const projectFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
  openProjectId: z.string().min(1, "Selecciona un proyecto de OpenProject"),
  boardId: z.string().optional(),
  boardListId: z.string().optional(),
});
export type ProjectFormInput = z.infer<typeof projectFormSchema>;

/** Formulario de Encargado — name y email obligatorios, phone opcional (igual que V1). */
export const managerFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  email: z.email("Correo inválido").max(254),
  phone: z.string().trim().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
});
export type ManagerFormInput = z.infer<typeof managerFormSchema>;
