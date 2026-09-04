-- Additive rollout: existing clients remain unchanged. No history is invented
-- for work done before this migration. Apply before deploying the history UI.
begin;

-- RLS controls which rows; column grants control which fields may be written.
revoke insert, update, delete on public.clients from public, anon, authenticated;
grant insert (id, consultant_id, name, herd_number, county, phone, email)
  on public.clients to authenticated;
grant update (name, herd_number, county, phone, email, archived_at)
  on public.clients to authenticated;

create table public.client_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  consultant_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'archived', 'restored')),
  changed_fields text[] not null default '{}' check (
    changed_fields <@ array['name','herd_number','county','phone','email','archived_at']::text[]
  ),
  occurred_at timestamptz not null default clock_timestamp()
);
alter table public.client_events enable row level security;
alter table public.client_events force row level security;
create policy consultants_read_own_client_events on public.client_events
  for select to authenticated using ((select auth.uid()) = consultant_id);
revoke all on public.client_events from public, anon, authenticated;
grant select on public.client_events to authenticated;
create index client_events_owner_client_time_idx
  on public.client_events (consultant_id, client_id, occurred_at desc, id);

-- Only the trigger can write history. The definer needs to bypass the read-only
-- user grants; every value comes from the row, never from an RPC argument.
create function public.record_client_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  event_action text := 'created';
  fields text[] := '{}';
begin
  if tg_op = 'UPDATE' then
    if new.name is distinct from old.name then fields := array_append(fields, 'name'); end if;
    if new.herd_number is distinct from old.herd_number then fields := array_append(fields, 'herd_number'); end if;
    if new.county is distinct from old.county then fields := array_append(fields, 'county'); end if;
    if new.phone is distinct from old.phone then fields := array_append(fields, 'phone'); end if;
    if new.email is distinct from old.email then fields := array_append(fields, 'email'); end if;
    if new.archived_at is distinct from old.archived_at then fields := array_append(fields, 'archived_at'); end if;
    if cardinality(fields) = 0 then return new; end if;
    event_action := case
      when old.archived_at is null and new.archived_at is not null then 'archived'
      when old.archived_at is not null and new.archived_at is null then 'restored'
      else 'updated' end;
  end if;
  insert into public.client_events (client_id, consultant_id, action, changed_fields)
    values (new.id, new.consultant_id, event_action, fields);
  return new;
end;
$$;
revoke all on function public.record_client_event() from public, anon, authenticated;
create trigger clients_record_event after insert or update on public.clients
  for each row execute function public.record_client_event();

commit;
