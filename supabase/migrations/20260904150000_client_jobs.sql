begin;

alter table public.clients add constraint clients_id_owner_unique unique (id, consultant_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  consultant_id uuid not null default auth.uid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  target_date date check (target_date between date '2000-01-01' and date '2100-12-31'),
  status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (client_id, consultant_id) references public.clients (id, consultant_id) on delete cascade
);
create index jobs_client_owner_idx on public.jobs (consultant_id, client_id, created_at desc, id);
alter table public.jobs enable row level security;
alter table public.jobs force row level security;
create policy jobs_select on public.jobs for select to authenticated using ((select auth.uid()) = consultant_id);
create policy jobs_insert on public.jobs for insert to authenticated with check ((select auth.uid()) = consultant_id);
create policy jobs_update on public.jobs for update to authenticated
  using ((select auth.uid()) = consultant_id) with check ((select auth.uid()) = consultant_id);
revoke all on public.jobs from public, anon, authenticated;
grant select on public.jobs to authenticated;
grant insert (id,client_id,consultant_id,title,target_date) on public.jobs to authenticated;
grant update (status) on public.jobs to authenticated;

-- Invoker visibility and the composite FK independently protect client ownership.
-- SHARE serializes against client archive updates, not just key changes.
create function public.guard_job_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.clients
    where id = new.client_id and consultant_id = new.consultant_id and archived_at is null
    for share;
  if not found then
    raise exception 'An active accessible client is required' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if new.status = old.status then return new; end if;
    if not (
      (old.status = 'planned' and new.status in ('in_progress','cancelled')) or
      (old.status = 'in_progress' and new.status in ('completed','cancelled')) or
      (old.status = 'completed' and new.status = 'in_progress') or
      (old.status = 'cancelled' and new.status = 'planned')
    ) then raise exception 'Invalid job transition' using errcode = '23514'; end if;
    new.version = old.version + 1;
    new.updated_at = clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function public.guard_job_change() from public, anon, authenticated;
create trigger guard_job_change before insert or update on public.jobs
for each row execute function public.guard_job_change();

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  client_id uuid not null,
  consultant_id uuid not null,
  status text not null check (status in ('planned','in_progress','completed','cancelled')),
  version integer not null,
  occurred_at timestamptz not null default clock_timestamp(),
  unique (job_id, version),
  foreign key (client_id, consultant_id) references public.clients (id, consultant_id) on delete cascade
);
create index job_events_owner_idx on public.job_events (consultant_id, client_id, occurred_at desc);
alter table public.job_events enable row level security;
alter table public.job_events force row level security;
create policy job_events_select on public.job_events for select to authenticated using ((select auth.uid()) = consultant_id);
revoke all on public.job_events from public, anon, authenticated;
grant select on public.job_events to authenticated;
create function public.record_job_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.job_events (job_id,client_id,consultant_id,status,version)
      values (new.id,new.client_id,new.consultant_id,new.status,new.version);
  end if;
  return new;
end;
$$;
revoke all on function public.record_job_event() from public, anon, authenticated;
create trigger record_job_event after insert or update on public.jobs
for each row execute function public.record_job_event();
commit;
