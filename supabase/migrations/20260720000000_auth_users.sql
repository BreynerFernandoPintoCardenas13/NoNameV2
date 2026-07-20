-- ============================================================
-- NoName · Autenticación: tabla pública de usuarios
-- Ejecutar en el SQL Editor de Supabase (o `supabase db push`).
-- ============================================================

-- ---------- Enum de roles (únicos valores permitidos) ----------
create type public.user_role as enum ('superadmin', 'admin', 'project_manager');

-- ---------- Tabla users ----------
create table public.users (
  id                  uuid primary key default gen_random_uuid(),
  auth_id             uuid not null unique references auth.users (id) on delete cascade,
  username            text not null unique
                        check (username ~ '^[A-Za-z0-9_-]{3,30}$'),
  email               text not null unique,
  openproject_api_key text,
  role                public.user_role not null default 'project_manager',
  pay                 integer not null default 0 check (pay in (0, 1)),
  email_verified      boolean not null default false,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index users_auth_id_idx on public.users (auth_id);

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---------- Sincronización desde auth.users ----------
-- Al crear una cuenta (email+password u OAuth) se inserta la fila pública.
-- El username viene de raw_user_meta_data (registro propio) o se deriva del
-- correo (OAuth Google); si colisiona, se agrega un sufijo corto.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired text;
  candidate text;
begin
  desired := coalesce(
    new.raw_user_meta_data ->> 'username',
    regexp_replace(split_part(new.email, '@', 1), '[^A-Za-z0-9_-]', '', 'g')
  );
  desired := substr(desired, 1, 30);
  if desired is null or length(desired) < 3 then
    desired := 'user';
  end if;

  candidate := desired;
  while exists (select 1 from public.users where username = candidate) loop
    candidate := substr(desired, 1, 24) || '-' || substr(md5(random()::text), 1, 5);
  end loop;

  insert into public.users (auth_id, email, username, email_verified)
  values (new.id, new.email, candidate, new.email_confirmed_at is not null);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Al confirmarse el correo, reflejarlo en la tabla pública.
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email_verified = (new.email_confirmed_at is not null),
      email = new.email
  where auth_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email_confirmed_at, email on auth.users
  for each row execute function public.handle_auth_user_updated();

-- ---------- Seguridad: RLS + privilegios por columna ----------
alter table public.users enable row level security;

-- El cliente (anon/authenticated) pierde todo privilegio por defecto.
revoke all on table public.users from anon, authenticated;

-- Un usuario autenticado solo puede LEER su propia fila, y NUNCA la columna
-- openproject_api_key (privilegio de columna revocado: no aparece en network).
grant select (id, auth_id, username, email, role, pay, email_verified, active, created_at, updated_at)
  on public.users to authenticated;

-- Solo puede ACTUALIZAR su API key (escritura única vía TLS, sin lectura).
grant update (openproject_api_key) on public.users to authenticated;

create policy "users_select_own"
  on public.users for select
  to authenticated
  using (auth.uid() = auth_id);

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);
