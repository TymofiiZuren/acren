begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('client-documents','client-documents',false,768000,array['application/pdf']);

create function public.can_access_client_document(object_name text, require_active boolean default false)
returns boolean language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null
    and split_part(object_name,'/',1) = auth.uid()::text
    and array_length(string_to_array(object_name,'/'),1) = 3
    and split_part(object_name,'/',3) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}--[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.pdf$'
    and exists (select 1 from public.clients where id::text = split_part(object_name,'/',2)
      and consultant_id = auth.uid() and (not require_active or archived_at is null));
$$;
revoke all on function public.can_access_client_document(text,boolean) from public, anon;
grant execute on function public.can_access_client_document(text,boolean) to authenticated;

create policy client_documents_read on storage.objects for select to authenticated
using (bucket_id = 'client-documents' and public.can_access_client_document(name));
create policy client_documents_insert on storage.objects for insert to authenticated
with check (bucket_id = 'client-documents' and public.can_access_client_document(name,true));
-- Restrictive guards keep future permissive policies for other buckets from
-- accidentally opening this bucket. No change to access in other buckets.
create policy client_documents_read_boundary on storage.objects as restrictive for select to public
using (bucket_id <> 'client-documents' or (auth.uid() is not null and split_part(name,'/',1) = auth.uid()::text));
create policy client_documents_insert_boundary on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'client-documents' or public.can_access_client_document(name,true));
create policy client_documents_no_update on storage.objects as restrictive for update to public
using (bucket_id <> 'client-documents') with check (bucket_id <> 'client-documents');
create policy client_documents_no_delete on storage.objects as restrictive for delete to public
using (bucket_id <> 'client-documents');
commit;
