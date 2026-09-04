begin;

select plan(16);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'account-a@acren.test'),
  ('22222222-2222-4222-8222-222222222222', 'account-b@acren.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

insert into public.clients (id, name, herd_number, county, phone, email)
values ('33333333-3333-4333-8333-333333333333', 'Aoife Murphy', 'A100001', 'Cork', '087 111 1111', 'aoife@example.test');

select is((select count(*)::integer from public.clients), 1, 'account A sees its client');
select is((select consultant_id from public.clients limit 1), '11111111-1111-4111-8111-111111111111'::uuid, 'ownership defaults to the authenticated user');

select throws_ok(
  $$insert into public.clients (consultant_id, name, herd_number, county, phone, email)
    values ('22222222-2222-4222-8222-222222222222', 'Stolen owner', 'A100002', 'Cork', '087 000 0000', 'owner@example.test')$$,
  '42501',
  null,
  'account A cannot create a client owned by B'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select is((select count(*)::integer from public.clients), 0, 'account B cannot read account A client');
select is((select count(*)::integer from public.clients where herd_number = 'A100001'), 0, 'direct herd lookup is isolated');
select is((select count(*)::integer from public.clients where id = '33333333-3333-4333-8333-333333333333'), 0, 'known UUID lookup cannot read another consultant record');

update public.clients set name = 'Compromised' where herd_number = 'A100001';
select is((select count(*)::integer from public.clients where name = 'Compromised'), 0, 'account B cannot update account A client');

select throws_ok($$delete from public.clients where herd_number = 'A100001'$$, '42501', null, 'account B cannot delete account A client');

insert into public.clients (name, herd_number, county, phone, email)
values ('Brian Kelly', 'B200001', 'Galway', '087 222 2222', 'brian@example.test');

select is((select count(*)::integer from public.clients), 1, 'account B sees its own client');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select is((select count(*)::integer from public.clients), 1, 'account A still sees exactly one client');
select is((select name from public.clients limit 1), 'Aoife Murphy', 'account A record was not changed');

update public.clients set archived_at = now() where herd_number = 'A100001';
select ok((select archived_at is not null from public.clients limit 1), 'account A can archive its client');

select throws_ok(
  $$update public.clients
    set consultant_id = '22222222-2222-4222-8222-222222222222'
    where herd_number = 'A100001'$$,
  '42501',
  null,
  'account A cannot transfer ownership through update'
);

set local role anon;
select throws_ok($$select * from public.clients$$, '42501', null, 'anonymous reads are denied');
select throws_ok($$insert into public.clients (name, herd_number, county, phone, email) values ('Anonymous', 'ANON001', 'Cork', '087 111 1111', 'anon@example.test')$$, '42501', null, 'anonymous inserts are denied');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*)::integer from public.clients), 0, 'authenticated role without a user ID sees no clients');

select * from finish();
rollback;
