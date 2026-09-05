begin;
create table public.billing_profiles (
  consultant_id uuid primary key default auth.uid() references auth.users(id),
  business_name text not null check (char_length(trim(business_name)) between 1 and 160),
  business_address text not null check (char_length(trim(business_address)) between 1 and 500),
  vat_registered boolean not null,
  vat_number text not null default '' check (char_length(vat_number)<=40),
  check ((vat_registered and char_length(trim(vat_number))>0) or (not vat_registered and vat_number=''))
);
alter table public.billing_profiles enable row level security;
alter table public.billing_profiles force row level security;
create policy billing_profile_owner on public.billing_profiles for all to authenticated using ((select auth.uid())=consultant_id) with check ((select auth.uid())=consultant_id);
revoke all on public.billing_profiles from public,anon,authenticated;
grant select on public.billing_profiles to authenticated;
grant insert(consultant_id,business_name,business_address,vat_registered,vat_number), update(business_name,business_address,vat_registered,vat_number) on public.billing_profiles to authenticated;

alter table public.jobs add constraint jobs_id_owner_unique unique(id,consultant_id);
alter table public.rates add constraint rates_id_owner_unique unique(id,consultant_id);
create table public.invoices (
  id uuid primary key,
  consultant_id uuid not null references auth.users(id),
  client_id uuid not null,
  job_id uuid not null,
  rate_id uuid not null,
  status text not null default 'draft' check(status in ('draft','issued','paid','void')),
  supplier_name text not null, supplier_address text not null, supplier_vat_number text not null,
  vat_registered boolean not null,
  customer_name text not null, customer_address text not null check(char_length(trim(customer_address)) between 1 and 500),
  description text not null, rate_name text not null, unit text not null check(unit in ('fixed','hour','unit')),
  price_cents integer not null check(price_cents between 0 and 100000000),
  quantity numeric not null check(quantity>0 and quantity<=10000 and quantity*100=trunc(quantity*100)),
  vat_basis_points integer check(vat_basis_points between 0 and 10000),
  net_cents bigint not null check(net_cents between 0 and 1000000000000),
  vat_cents bigint not null check(vat_cents between 0 and 1000000000000),
  total_cents bigint not null check(total_cents=net_cents+vat_cents),
  supply_date date not null check(supply_date between date '2000-01-01' and date '2100-12-31'),
  due_date date not null check(due_date between date '2000-01-01' and date '2100-12-31'),
  invoice_number integer check(invoice_number>0),
  issued_at timestamptz, paid_date date, created_at timestamptz not null default clock_timestamp(),
  unique(consultant_id,invoice_number), unique(id,consultant_id),
  foreign key(client_id,consultant_id) references public.clients(id,consultant_id),
  foreign key(job_id,consultant_id) references public.jobs(id,consultant_id),
  foreign key(rate_id,consultant_id) references public.rates(id,consultant_id),
  check ((vat_registered and vat_basis_points is not null and supplier_vat_number<>'') or (not vat_registered and vat_basis_points is null and vat_cents=0 and supplier_vat_number='')),
  check ((status in ('draft','void') and invoice_number is null and issued_at is null and paid_date is null) or (status='issued' and invoice_number is not null and issued_at is not null and paid_date is null) or (status='paid' and invoice_number is not null and issued_at is not null and paid_date is not null))
);
create unique index one_live_invoice_per_job on public.invoices(job_id) where status<>'void';
create index invoices_owner_status on public.invoices(consultant_id,status,created_at desc,id);
alter table public.invoices enable row level security;
alter table public.invoices force row level security;
create policy invoices_owner_read on public.invoices for select to authenticated using ((select auth.uid())=consultant_id);
revoke all on public.invoices from public,anon,authenticated;
grant select on public.invoices to authenticated;

create table public.invoice_counters(consultant_id uuid primary key references auth.users(id),last_number integer not null check(last_number>0));
alter table public.invoice_counters enable row level security;
alter table public.invoice_counters force row level security;
revoke all on public.invoice_counters from public,anon,authenticated;
create table public.invoice_events (
 id uuid primary key default gen_random_uuid(),invoice_id uuid not null,consultant_id uuid not null,
 action text not null check(action in ('created','issued','paid','void')),occurred_at timestamptz not null default clock_timestamp(),
 foreign key(invoice_id,consultant_id) references public.invoices(id,consultant_id), unique(invoice_id,action)
);
alter table public.invoice_events enable row level security;
alter table public.invoice_events force row level security;
create policy invoice_events_owner_read on public.invoice_events for select to authenticated using ((select auth.uid())=consultant_id);
revoke all on public.invoice_events from public,anon,authenticated;
grant select on public.invoice_events to authenticated;

create function public.create_invoice_draft(p_id uuid,p_job_id uuid,p_rate_id uuid,p_quantity numeric,p_customer_address text,p_supply_date date,p_due_date date,p_vat_basis_points integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  caller uuid:=auth.uid(); j public.jobs%rowtype; r public.rates%rowtype; c public.clients%rowtype; b public.billing_profiles%rowtype; existing public.invoices%rowtype;
  net bigint; vat bigint;
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into j from public.jobs where id=p_job_id and consultant_id=caller for update;
  if not found then raise exception 'Work is not accessible' using errcode='42501'; end if;
  select * into existing from public.invoices where id=p_id and consultant_id=caller;
  if found then
    if existing.job_id=p_job_id and existing.rate_id=p_rate_id and existing.quantity=p_quantity and existing.customer_address=trim(p_customer_address) and existing.supply_date=p_supply_date and existing.due_date=p_due_date and existing.vat_basis_points is not distinct from p_vat_basis_points then return existing.id; end if;
    raise exception 'Request already used' using errcode='23514';
  end if;
  if j.status<>'completed' then raise exception 'Complete the job first' using errcode='23514'; end if;
  select * into c from public.clients where id=j.client_id and consultant_id=caller and archived_at is null for share;
  if not found then raise exception 'Active client required' using errcode='23514'; end if;
  select * into r from public.rates where id=p_rate_id and consultant_id=caller and not retired for share;
  if not found then raise exception 'Active rate required' using errcode='23514'; end if;
  select * into b from public.billing_profiles where consultant_id=caller for share;
  if not found then raise exception 'Business details required' using errcode='23514'; end if;
  if p_quantity is null or p_quantity<=0 or p_quantity>10000 or p_quantity*100<>trunc(p_quantity*100) or (r.unit='fixed' and p_quantity<>1) then raise exception 'Invalid quantity' using errcode='23514'; end if;
  if p_customer_address is null or char_length(trim(p_customer_address)) not between 1 and 500 or p_supply_date is null or p_due_date is null or p_supply_date>(now() at time zone 'Europe/Dublin')::date or p_due_date<(now() at time zone 'Europe/Dublin')::date then raise exception 'Check address and dates' using errcode='23514'; end if;
  if (b.vat_registered and (p_vat_basis_points is null or p_vat_basis_points not between 0 and 10000)) or (not b.vat_registered and p_vat_basis_points is not null) then raise exception 'Explicit VAT treatment required' using errcode='23514'; end if;
  net:=round(r.price_cents*p_quantity); vat:=round(net::numeric*coalesce(p_vat_basis_points,0)/10000);
  insert into public.invoices(id,consultant_id,client_id,job_id,rate_id,supplier_name,supplier_address,supplier_vat_number,vat_registered,customer_name,customer_address,description,rate_name,unit,price_cents,quantity,vat_basis_points,net_cents,vat_cents,total_cents,supply_date,due_date)
  values(p_id,caller,c.id,j.id,r.id,b.business_name,b.business_address,b.vat_number,b.vat_registered,c.name,trim(p_customer_address),j.title,r.name,r.unit,r.price_cents,p_quantity,p_vat_basis_points,net,vat,net+vat,p_supply_date,p_due_date);
  insert into public.invoice_events(invoice_id,consultant_id,action) values(p_id,caller,'created');
  return p_id;
end; $$;
revoke all on function public.create_invoice_draft(uuid,uuid,uuid,numeric,text,date,date,integer) from public,anon,authenticated;
grant execute on function public.create_invoice_draft(uuid,uuid,uuid,numeric,text,date,date,integer) to authenticated;

create function public.transition_invoice(p_id uuid,p_action text,p_paid_date date) returns uuid
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); inv public.invoices%rowtype; b public.billing_profiles%rowtype; n integer; today date:=(now() at time zone 'Europe/Dublin')::date;
begin
 if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into inv from public.invoices where id=p_id and consultant_id=caller for update;
 if not found then raise exception 'Invoice is not accessible' using errcode='42501'; end if;
 if p_action='issue' then
   if inv.status in ('issued','paid') then return p_id; end if;
   if inv.status<>'draft' then raise exception 'Only a draft can be issued' using errcode='23514'; end if;
   perform 1 from public.jobs where id=inv.job_id and consultant_id=caller and status='completed' for share;
   if not found then raise exception 'Completed work required' using errcode='23514'; end if;
   perform 1 from public.clients where id=inv.client_id and consultant_id=caller and archived_at is null for share;
   if not found then raise exception 'Active client required' using errcode='23514'; end if;
   select * into b from public.billing_profiles where consultant_id=caller for share;
   if not found or b.business_name<>inv.supplier_name or b.business_address<>inv.supplier_address or b.vat_registered<>inv.vat_registered or b.vat_number<>inv.supplier_vat_number then raise exception 'Business details changed; replace draft' using errcode='23514'; end if;
   if inv.due_date<today or inv.supply_date>today then raise exception 'Review invoice dates' using errcode='23514'; end if;
   insert into public.invoice_counters(consultant_id,last_number) values(caller,1) on conflict(consultant_id) do update set last_number=public.invoice_counters.last_number+1 returning last_number into n;
   update public.invoices set status='issued',invoice_number=n,issued_at=clock_timestamp() where id=p_id;
   insert into public.invoice_events(invoice_id,consultant_id,action) values(p_id,caller,'issued');
 elsif p_action='void' then
   if inv.status='void' then return p_id; end if;
   if inv.status<>'draft' then raise exception 'Issued invoices require a correction process' using errcode='23514'; end if;
   update public.invoices set status='void' where id=p_id;
   insert into public.invoice_events(invoice_id,consultant_id,action) values(p_id,caller,'void');
 elsif p_action='paid' then
   if inv.status='paid' and inv.paid_date=p_paid_date then return p_id; end if;
   if inv.status<>'issued' or p_paid_date is null or p_paid_date<(inv.issued_at at time zone 'Europe/Dublin')::date or p_paid_date>today then raise exception 'Review payment status and date' using errcode='23514'; end if;
   update public.invoices set status='paid',paid_date=p_paid_date where id=p_id;
   insert into public.invoice_events(invoice_id,consultant_id,action) values(p_id,caller,'paid');
 else raise exception 'Unsupported invoice action' using errcode='23514'; end if;
 return p_id;
end; $$;
revoke all on function public.transition_invoice(uuid,text,date) from public,anon,authenticated;
grant execute on function public.transition_invoice(uuid,text,date) to authenticated;

create function public.guard_billed_job() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status<>old.status and exists(select 1 from public.invoices where job_id=old.id and status<>'void') then raise exception 'Discard the draft before reopening; issued work is locked' using errcode='23514'; end if;
 return new;
end; $$;
revoke all on function public.guard_billed_job() from public,anon,authenticated;
create trigger guard_billed_job before update on public.jobs for each row execute function public.guard_billed_job();
commit;
