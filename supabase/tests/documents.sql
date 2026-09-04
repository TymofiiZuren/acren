begin;
select no_plan();
insert into auth.users (id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','files-a@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','files-b@example.test');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.clients (id,name,herd_number,county,phone,email) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','File fixture','FILE001','Cork','0000000000','file@example.test');
select lives_ok($$insert into storage.objects (bucket_id,name) values ('client-documents','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc/dddddddd-dddd-4ddd-8ddd-dddddddddddd--test.pdf')$$,'A can file a document for their own client');
select is((select count(*)::integer from storage.objects where bucket_id='client-documents'),1,'A can list their file');
update storage.objects set name='rewritten.pdf' where bucket_id='client-documents';
select is((select count(*)::integer from storage.objects where name like '%--test.pdf'),1,'files cannot be renamed or overwritten');
select throws_ok($$insert into storage.objects (bucket_id,name) values ('client-documents','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc/invalid.html')$$,'42501',null,'invalid object names denied');
update public.clients set archived_at=now();
select throws_ok($$insert into storage.objects (bucket_id,name) values ('client-documents','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee--test.pdf')$$,'42501',null,'archived clients cannot receive files');
select is((select count(*)::integer from storage.objects where bucket_id='client-documents'),1,'archiving retains access to existing files');
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select is((select count(*)::integer from storage.objects where bucket_id='client-documents'),0,'B cannot list A files');
select is((select count(*)::integer from storage.objects where name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc/dddddddd-dddd-4ddd-8ddd-dddddddddddd--test.pdf'),0,'known full path does not bypass isolation');
select throws_ok($$insert into storage.objects (bucket_id,name) values ('client-documents','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/cccccccc-cccc-4ccc-8ccc-cccccccccccc/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee--test.pdf')$$,'42501',null,'own prefix cannot attach files to another client');
select throws_ok($$insert into storage.objects (bucket_id,name) values ('client-documents','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee--test.pdf')$$,'42501',null,'forged owner prefix denied');
set local role anon;
select is((select count(*)::integer from storage.objects where bucket_id='client-documents'),0,'anonymous cannot list files');
reset role;
select ok((select not public from storage.buckets where id='client-documents'),'bucket is private');
select is((select file_size_limit from storage.buckets where id='client-documents'),768000::bigint,'storage API enforces 750 KiB limit');
select is((select allowed_mime_types from storage.buckets where id='client-documents'),array['application/pdf']::text[],'storage API allows PDFs only');
select * from finish();
rollback;
