begin;
select no_plan();

insert into auth.users (id, email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'history-a@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'history-b@example.test');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
insert into public.clients (id,name,herd_number,county,phone,email) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','History test','HISTORY001','Cork','0000000000','history@example.test');

select throws_ok($$update public.clients set id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$, '42501', null, 'client IDs cannot be changed');
select throws_ok($$update public.clients set created_at = now() - interval '1 year'$$, '42501', null, 'creation dates cannot be changed');
select throws_ok($$update public.clients set updated_at = now() - interval '1 year'$$, '42501', null, 'updated dates are database controlled');
select throws_ok($$insert into public.clients (name,herd_number,county,phone,email,created_at) values ('Fake date','HISTORY002','Cork','0000000000','history@example.test',now())$$, '42501', null, 'creation dates cannot be forged during insert');
select throws_ok($$delete from public.clients$$, '42501', null, 'ordinary accounts cannot permanently delete client records');

select is((select count(*)::integer from public.client_events), 1, 'create generates one history event');
select is((select action from public.client_events limit 1), 'created', 'creation is labelled correctly');
update public.clients set phone = '0000000001' where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select is((select count(*)::integer from public.client_events where action = 'updated'), 1, 'edit is recorded');
select is((select changed_fields from public.client_events where action = 'updated'), array['phone']::text[], 'history stores field names only');
update public.clients set phone = '0000000001' where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select is((select count(*)::integer from public.client_events), 2, 'unchanged saves do not create misleading history');
update public.clients set archived_at = now() where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select is((select count(*)::integer from public.client_events where action = 'archived'), 1, 'archive is recorded');
update public.clients set archived_at = null where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select is((select count(*)::integer from public.client_events where action = 'restored'), 1, 'restore is recorded');

select throws_ok($$insert into public.client_events (client_id,consultant_id,action) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','created')$$, '42501', null, 'history cannot be forged');
select throws_ok($$update public.client_events set action = 'created'$$, '42501', null, 'history cannot be rewritten');
select throws_ok($$delete from public.client_events$$, '42501', null, 'history cannot be removed');
select ok(not has_function_privilege('authenticated','public.record_client_event()','EXECUTE'), 'history trigger is not a callable user API');

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select is((select count(*)::integer from public.client_events), 0, 'B cannot read A history without any application filter');
select is((select count(*)::integer from public.client_events where client_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'), 0, 'known client UUID does not expose history');
update public.clients set archived_at = now() where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select is((select count(*)::integer from public.client_events), 4, 'cross-account update creates no event and changes no record');
select ok((select archived_at is null from public.clients where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'), 'B cannot archive A client');
set local role anon;
select throws_ok($$select * from public.client_events$$, '42501', null, 'anonymous history access is denied');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*)::integer from public.client_events), 0, 'missing identity exposes no history');
reset role;
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.client_events'::regclass), 'history RLS is enabled and forced');
select * from finish();
rollback;
