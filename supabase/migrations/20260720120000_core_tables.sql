-- ============================================================
-- NoName · Fase 1 de migración V1→V2: tablas núcleo
-- projects, notes, project_knowledge, project_managers,
-- user_settings, ticket_analyses + bucket de imágenes.
-- Modelo multiusuario: TODO es privado por usuario (owner_auth_id).
-- Ejecutar en el SQL Editor de Supabase después de 20260720000000_auth_users.sql.
-- ============================================================

-- ---------- projects (LocalProject de V1 + dueño) ----------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  owner_auth_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 120),
  openproject_id   integer not null,
  openproject_name text not null,
  board_id         integer,
  board_name       text,
  board_list_id    integer,
  board_list_name  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index projects_owner_idx on public.projects (owner_auth_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects_all_own" on public.projects
  for all to authenticated
  using (auth.uid() = owner_auth_id)
  with check (auth.uid() = owner_auth_id);

-- ---------- notes (MeetingNote de V1) ----------
-- document es el JSON nativo de Tiptap, incluidos los attrs `metadata` y `ticket`.
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title      text not null default '',
  document   jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_project_idx on public.notes (project_id, created_at);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

create policy "notes_all_own" on public.notes
  for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()));

-- ---------- project_knowledge (KB 1:1 con proyecto) ----------
create table public.project_knowledge (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  document   jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger project_knowledge_set_updated_at
  before update on public.project_knowledge
  for each row execute function public.set_updated_at();

alter table public.project_knowledge enable row level security;

create policy "project_knowledge_all_own" on public.project_knowledge
  for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()));

-- ---------- project_managers (Encargados de V1) ----------
create table public.project_managers (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 254),
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_managers_project_idx on public.project_managers (project_id);

create trigger project_managers_set_updated_at
  before update on public.project_managers
  for each row execute function public.set_updated_at();

alter table public.project_managers enable row level security;

create policy "project_managers_all_own" on public.project_managers
  for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()));

-- ---------- user_settings (UserSettings de V1, sin la API Key: esa vive en users) ----------
create table public.user_settings (
  id                           uuid primary key default gen_random_uuid(),
  auth_id                      uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  op_current_user_id           integer,
  op_current_user_name         text,
  op_current_user_login        text,
  responsible_override_enabled boolean not null default false,
  responsible_user_id          integer,
  responsible_user_name        text,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings_all_own" on public.user_settings
  for all to authenticated
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);

-- ---------- ticket_analyses (reemplaza el Map en memoria de V1) ----------
-- Propuesta de tickets generada por la IA, pendiente de confirmación humana.
create table public.ticket_analyses (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  drafts     jsonb not null,
  status     text not null default 'pending' check (status in ('pending', 'confirmed', 'expired')),
  expires_at timestamptz not null default now() + interval '1 hour',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ticket_analyses_note_idx on public.ticket_analyses (note_id);

create trigger ticket_analyses_set_updated_at
  before update on public.ticket_analyses
  for each row execute function public.set_updated_at();

alter table public.ticket_analyses enable row level security;

create policy "ticket_analyses_all_own" on public.ticket_analyses
  for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_auth_id = auth.uid()));

-- ---------- Storage: bucket privado para imágenes de notas ----------
-- Ruta convenida: <auth_id>/<note_id>/<uuid>.<ext> — el primer segmento es el dueño.
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', false)
on conflict (id) do nothing;

create policy "note_images_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "note_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "note_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);
