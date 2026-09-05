begin;

-- The consultant account is the advisor. No cross-practice sharing is added.
create table public.work_recommendations (
  job_id uuid primary key,
  consultant_id uuid not null,
  rate_id uuid not null,
  rate_name text not null,
  unit text not null check(unit in ('fixed','hour','unit')),
  price_cents integer not null check(price_cents between 0 and 100000000),
  quantity numeric not null check(quantity>0 and quantity<=10000 and quantity*100=trunc(quantity*100)),
  estimate_cents bigint not null check(estimate_cents=round(price_cents*quantity)),
  created_at timestamptz not null default clock_timestamp(),
  foreign key(job_id,consultant_id) references public.jobs(id,consultant_id) on delete cascade,
  foreign key(rate_id,consultant_id) references public.rates(id,consultant_id)
);
alter table public.work_recommendations enable row level security;
alter table public.work_recommendations force row level security;
create policy recommendations_owner_read on public.work_recommendations for select to authenticated using ((select auth.uid())=consultant_id);
revoke all on public.work_recommendations from public,anon,authenticated;
grant select on public.work_recommendations to authenticated;
create index recommendations_owner on public.work_recommendations(consultant_id,job_id);

create function public.recommend_work(p_id uuid,p_client_id uuid,p_title text,p_rate_id uuid,p_quantity numeric) returns uuid
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); r public.rates%rowtype; previous record;
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_id is null then raise exception 'Request identifier required' using errcode='23514'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text||p_id::text,0));
  select j.client_id,j.title,w.rate_id,w.quantity into previous from public.jobs j join public.work_recommendations w on w.job_id=j.id
    where j.id=p_id and j.consultant_id=caller and w.consultant_id=caller;
  if found then
    if previous.client_id=p_client_id and previous.title=trim(p_title) and previous.rate_id=p_rate_id and previous.quantity=p_quantity then return p_id; end if;
    raise exception 'Request already used' using errcode='23514';
  end if;
  perform 1 from public.clients where id=p_client_id and consultant_id=caller and archived_at is null for share;
  if not found then raise exception 'Active accessible client required' using errcode='42501'; end if;
  select * into r from public.rates where id=p_rate_id and consultant_id=caller and not retired for share;
  if not found then raise exception 'Active accessible rate required' using errcode='42501'; end if;
  if p_title is null or char_length(trim(p_title)) not between 1 and 120 or p_quantity is null or p_quantity<=0 or p_quantity>10000 or p_quantity*100<>trunc(p_quantity*100) or (r.unit='fixed' and p_quantity<>1) then
    raise exception 'Check description and quantity' using errcode='23514';
  end if;
  insert into public.jobs(id,client_id,consultant_id,title) values(p_id,p_client_id,caller,trim(p_title));
  insert into public.work_recommendations(job_id,consultant_id,rate_id,rate_name,unit,price_cents,quantity,estimate_cents)
    values(p_id,caller,r.id,r.name,r.unit,r.price_cents,p_quantity,round(r.price_cents*p_quantity));
  return p_id;
end; $$;
revoke all on function public.recommend_work(uuid,uuid,text,uuid,numeric) from public,anon,authenticated;
grant execute on function public.recommend_work(uuid,uuid,text,uuid,numeric) to authenticated;

-- Aggregate the complete record set in PostgreSQL, not a paginated UI list.
-- Invoker RLS plus the initial client lookup also protect the aggregate itself.
create function public.client_work_balance(p_client_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
   'owed_cents',(select coalesce(sum(total_cents),0)::text from public.invoices where client_id=c.id and status='issued'),
   'overdue_cents',(select coalesce(sum(total_cents),0)::text from public.invoices where client_id=c.id and status='issued' and due_date<(now() at time zone 'Europe/Dublin')::date),
   'estimated_cents',(select coalesce(sum(w.estimate_cents),0)::text from public.work_recommendations w join public.jobs j on j.id=w.job_id where j.client_id=c.id and j.status<>'cancelled' and not exists(select 1 from public.invoices i where i.job_id=j.id and i.status<>'void')),
   'open_jobs',(select count(*)::text from public.jobs where client_id=c.id and status in ('planned','in_progress')),
   'completed_jobs',(select count(*)::text from public.jobs where client_id=c.id and status='completed')
 ) from public.clients c where c.id=p_client_id and c.consultant_id=(select auth.uid());
$$;
revoke all on function public.client_work_balance(uuid) from public,anon,authenticated;
grant execute on function public.client_work_balance(uuid) to authenticated;
commit;
