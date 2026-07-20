/**
 * Migración one-shot de los datos de NoNameV1 (JSON en disco) a Supabase.
 *
 * Uso:
 *   node scripts/migrate-v1-data.mjs --data-dir ../NoNameV1/data --auth-id <uuid-del-usuario>
 *
 * Requiere en el entorno (.env): NEXT_PUBLIC_SUPABASE_URL y
 * SUPABASE_SERVICE_ROLE_KEY. `--auth-id` es el auth.users.id del dueño al
 * que se le asignarán todos los proyectos (V1 era single-user).
 *
 * Qué hace, en orden e idempotente (upsert por id — los UUIDs de V1 se
 * conservan, así que re-ejecutar no duplica):
 *   1. projects.json        → public.projects
 *   2. notes.json           → public.notes, extrayendo cada imagen base64
 *                             embebida, subiéndola al bucket note-images y
 *                             reescribiendo el nodo con su URL firmada.
 *   3. project-knowledge.json → public.project_knowledge
 *   4. project-managers.json  → public.project_managers
 *   5. user-settings.json     → public.user_settings (defaultResponsible +
 *                             perfil de OpenProject). La API Key NO se migra:
 *                             se considera comprometida (estaba en claro en
 *                             disco) — rotarla y cargarla desde Configuración.
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function arg(name) {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : undefined;
}

const dataDir = arg("--data-dir");
const authId = arg("--auth-id");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dataDir || !authId || !url || !serviceKey) {
  console.error(
    "Faltan parámetros. Uso:\n  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\\n  node scripts/migrate-v1-data.mjs --data-dir ../NoNameV1/data --auth-id <uuid>",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const BUCKET = "note-images";
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 365;

function readJson(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/** Recorre el documento y sube cada imagen data-URL, reescribiendo su src. */
async function migrateDocumentImages(document, noteId) {
  let uploaded = 0;

  async function walk(node) {
    if (node.type === "image" && typeof node.attrs?.src === "string") {
      const match = /^data:([^;]+);base64,(.+)$/.exec(node.attrs.src);
      if (match) {
        const [, contentType, base64] = match;
        const extension = (contentType.split("/")[1] ?? "png").split("+")[0];
        const storagePath = `${authId}/${noteId}/${randomUUID()}.${extension}`;
        const bytes = Buffer.from(base64, "base64");

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, bytes, { contentType, upsert: false });
        if (uploadError) throw new Error(`Subiendo imagen de nota ${noteId}: ${uploadError.message}`);

        const { data: signed, error: signError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(storagePath, SIGNED_URL_SECONDS);
        if (signError) throw new Error(`Firmando imagen de nota ${noteId}: ${signError.message}`);

        uploaded += 1;
        return { ...node, attrs: { ...node.attrs, src: signed.signedUrl } };
      }
    }
    if (!node.content) return node;
    const content = [];
    for (const child of node.content) content.push(await walk(child));
    return { ...node, content };
  }

  const migrated = await walk(document);
  return { document: migrated, uploaded };
}

async function upsert(table, rows, label) {
  if (rows.length === 0) {
    console.log(`- ${label}: nada que migrar`);
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Insertando en ${table}: ${error.message}`);
  console.log(`- ${label}: ${rows.length} fila(s)`);
}

async function main() {
  console.log(`Migrando datos de ${dataDir} para el usuario ${authId}\n`);

  // 1. Proyectos
  const projects = readJson("projects.json") ?? [];
  await upsert(
    "projects",
    projects.map((p) => ({
      id: p.id,
      owner_auth_id: authId,
      name: p.name,
      openproject_id: p.openProjectId,
      openproject_name: p.openProjectName,
      board_id: p.boardId ?? null,
      board_name: p.boardName ?? null,
      board_list_id: p.boardListId ?? null,
      board_list_name: p.boardListName ?? null,
    })),
    "projects",
  );

  // 2. Notas (con extracción de imágenes)
  const notes = readJson("notes.json") ?? [];
  let totalImages = 0;
  const noteRows = [];
  for (const note of notes) {
    const { document, uploaded } = await migrateDocumentImages(note.document, note.id);
    totalImages += uploaded;
    noteRows.push({
      id: note.id,
      project_id: note.projectId,
      title: note.title ?? "",
      document,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    });
  }
  await upsert("notes", noteRows, `notes (${totalImages} imagen(es) subidas a Storage)`);

  // 3. Base de conocimiento
  const knowledge = readJson("project-knowledge.json") ?? [];
  await upsert(
    "project_knowledge",
    knowledge.map((k) => ({
      // V1 no guardaba id propio: clave por project_id (unique)
      project_id: k.projectId,
      document: k.document,
    })),
    "project_knowledge",
  );

  // 4. Encargados
  const managers = readJson("project-managers.json") ?? [];
  await upsert(
    "project_managers",
    managers.map((m) => ({
      id: m.id,
      project_id: m.projectId,
      name: m.name,
      email: m.email,
      phone: m.phone ?? null,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    })),
    "project_managers",
  );

  // 5. Settings (sin la API Key: rotar y cargar desde Configuración)
  const settings = readJson("user-settings.json");
  if (settings) {
    const { error } = await supabase.from("user_settings").upsert(
      {
        auth_id: authId,
        op_current_user_id: settings.currentUser?.id ?? null,
        op_current_user_name: settings.currentUser?.name ?? null,
        op_current_user_login: settings.currentUser?.login ?? null,
        responsible_override_enabled: settings.defaultResponsible?.overrideEnabled ?? false,
        responsible_user_id: settings.defaultResponsible?.userId ?? null,
        responsible_user_name: settings.defaultResponsible?.userName ?? null,
      },
      { onConflict: "auth_id" },
    );
    if (error) throw new Error(`user_settings: ${error.message}`);
    console.log("- user_settings: 1 fila (API Key NO migrada — rotar y recargar)");
  }

  console.log("\nMigración completada.");
  if (settings?.openProjectApiKey) {
    console.warn(
      "AVISO: user-settings.json contiene una API Key en claro. Considérala comprometida: revócala en OpenProject y genera una nueva desde Configuración.",
    );
  }
}

main().catch((error) => {
  console.error("\nLa migración falló:", error.message);
  process.exit(1);
});
