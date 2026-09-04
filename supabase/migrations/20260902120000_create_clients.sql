create extension if not exists "pgcrypto";

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  herd_number text not null check (char_length(trim(herd_number)) between 1 and 32),
  county text not null check (char_length(trim(county)) between 1 and 40),
  phone text not null check (char_length(trim(phone)) between 1 and 32),
  email text not null check (char_length(trim(email)) between 3 and 254),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (consultant_id, herd_number)
);

alter table public.clients enable row level security;
alter table public.clients force row level security;

create policy "consultants_select_own_clients"
  on public.clients for select
  to authenticated
  using ((select auth.uid()) = consultant_id);

create policy "consultants_insert_own_clients"
  on public.clients for insert
  to authenticated
  with check ((select auth.uid()) = consultant_id);

create policy "consultants_update_own_clients"
  on public.clients for update
  to authenticated
  using ((select auth.uid()) = consultant_id)
  with check ((select auth.uid()) = consultant_id);

create policy "consultants_delete_own_clients"
  on public.clients for delete
  to authenticated
  using ((select auth.uid()) = consultant_id);

create index clients_consultant_active_idx
  on public.clients (consultant_id, archived_at, name);

create index clients_consultant_herd_idx
  on public.clients (consultant_id, herd_number);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

revoke all on table public.clients from anon;
grant select, insert, update, delete on table public.clients to authenticated;

