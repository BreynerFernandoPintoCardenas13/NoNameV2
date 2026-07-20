import { getSupabaseBrowserClient } from "@/modules/auth/services/supabase.client";

/**
 * Imágenes de notas en Supabase Storage (bucket privado `note-images`).
 * Ruta: <auth_id>/<note_id>/<uuid>.<ext> — el primer segmento es el dueño
 * (las policies del bucket lo exigen). Reemplaza los data-URLs embebidos de
 * V1: el documento guarda una URL firmada, no megabytes de base64.
 */

const BUCKET = "note-images";

// ponytail: URL firmada a 1 año en lugar de resolver rutas al vuelo con una
// extensión propia de Tiptap; si algún día expira una imagen de una nota
// vieja, el upgrade es un re-firmado batch, no un rediseño del documento.
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 365;

export async function uploadNoteImage(noteId: string, file: File): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión no válida.");

  const extension = file.type.split("/")[1]?.split("+")[0] || "png";
  const path = `${user.id}/${noteId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error("No se pudo subir la imagen.");

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (signError || !data?.signedUrl) throw new Error("No se pudo preparar la imagen.");

  return data.signedUrl;
}
