begin;
create table public.rates (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null default auth.uid() references auth.users(id),
  name text not null check (char_length(trim(name)) between 1 and 120),
  unit text not null check (unit in ('fixed','hour','unit')),
  price_cents integer not null check (price_cents between 0 and 100000000),
  retired boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  retired_at timestamptz,
  check (retired = (retired_at is not null))
);
create index rates_owner_idx on public.rates(consultant_id, retired, created_at desc, id);
alter table public.rates enable row level security;
alter table public.rates force row level security;
create policy rates_select on public.rates for select to authenticated using ((select auth.uid()) = consultant_id);
create policy rates_insert on public.rates for insert to authenticated with check ((select auth.uid()) = consultant_id);
create policy rates_update on public.rates for update to authenticated using ((select auth.uid()) = consultant_id) with check ((select auth.uid()) = consultant_id);
revoke all on public.rates from public, anon, authenticated;
grant select on public.rates to authenticated;
grant insert (id,consultant_id,name,unit,price_cents) on public.rates to authenticated;
grant update (retired) on public.rates to authenticated;

create function public.guard_rate_retirement() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if old.retired and not new.retired then raise exception 'Retired rates are immutable' using errcode = '23514'; end if;
  if new.retired and not old.retired then new.retired_at = clock_timestamp(); end if;
  return new;
end;
$$;
revoke all on function public.guard_rate_retirement() from public, anon, authenticated;
create trigger guard_rate_retirement before update on public.rates for each row execute function public.guard_rate_retirement();

create table public.rate_events (
  id uuid primary key default gen_random_uuid(),
  rate_id uuid not null references public.rates(id),
  consultant_id uuid not null references auth.users(id),
  action text not null check (action in ('created','retired')),
  occurred_at timestamptz not null default clock_timestamp(),
  unique(rate_id, action)
);
create index rate_events_owner_idx on public.rate_events(consultant_id, occurred_at desc);
alter table public.rate_events enable row level security;
alter table public.rate_events force row level security;
create policy rate_events_select on public.rate_events for select to authenticated using ((select auth.uid()) = consultant_id);
revoke all on public.rate_events from public, anon, authenticated;
grant select on public.rate_events to authenticated;
create function public.record_rate_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.rate_events(rate_id,consultant_id,action) values(new.id,new.consultant_id,'created');
  elsif new.retired and not old.retired then
    insert into public.rate_events(rate_id,consultant_id,action) values(new.id,new.consultant_id,'retired');
  end if;
  return new;
end;
$$;
revoke all on function public.record_rate_event() from public, anon, authenticated;
create trigger record_rate_event after insert or update on public.rates for each row execute function public.record_rate_event();
commit;
