-- ============================================================
-- 011 — Tenant-scoped storage policies
-- ============================================================
-- Stream A — Foundation & Multi-Tenant Core
--
-- All Supabase Storage objects must live under a path that begins
-- with the tenant_id (as the first folder segment), e.g.:
--
--   violations/<tenant_id>/<violation_id>/photo-1.jpg
--   documents/<tenant_id>/<doc_id>.pdf
--   logos/<tenant_id>/logo.png
--   email-attachments/<tenant_id>/<letter_id>/...
--
-- The single shared bucket "hoa-assets" added by the original spec
-- is NOT used — we keep the existing bucket layout (violations,
-- documents, logos, email-attachments) and instead enforce the
-- tenant_id prefix via RLS so the existing app does not break.
-- ============================================================

-- Helper: extract the tenant_id from the first path segment.
-- storage.foldername(name) returns text[]; element 1 is the first segment.
-- We coerce to uuid; if the path doesn't start with a valid UUID, the
-- coercion fails and the policy denies access. That's the desired behavior.
create or replace function public.storage_object_tenant_id(object_name text)
returns uuid
language sql
stable
as $$
  select case
    when (storage.foldername(object_name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
    else null
  end;
$$;

grant execute on function public.storage_object_tenant_id(text) to authenticated, anon;

-- ============================================================
-- Drop the legacy single-tenant storage policies installed in 005/007
-- ============================================================
drop policy if exists "Authenticated users can upload violation photos" on storage.objects;
drop policy if exists "Authenticated users can view violation photos" on storage.objects;
drop policy if exists "Admin/board can delete violation photos" on storage.objects;

drop policy if exists "Anyone can read documents" on storage.objects;
drop policy if exists "Authenticated users can upload documents" on storage.objects;
drop policy if exists "Admin/board can delete documents" on storage.objects;

drop policy if exists "Anyone can read logos" on storage.objects;
drop policy if exists "Admin can upload logos" on storage.objects;
drop policy if exists "Admin can delete logos" on storage.objects;

drop policy if exists "Authenticated users can upload email attachments" on storage.objects;
drop policy if exists "Authenticated users can view email attachments" on storage.objects;
drop policy if exists "Admin/board can delete email attachments" on storage.objects;

-- ============================================================
-- Standard 4-policy tenant clamp on the shared buckets
-- ============================================================
-- Buckets covered: violations, documents, logos, email-attachments.
-- For each bucket we install one SELECT and one INSERT/UPDATE/DELETE
-- policy that requires the user to be an active member of the tenant
-- whose UUID matches the first folder segment.

-- READ policy (covers all four private/public buckets uniformly).
-- Note: this is more restrictive than the previous "public" policies
-- on documents/logos. Public read of marketing assets will be served
-- via signed URLs created server-side or via a separate public bucket
-- (added by Stream B if needed). For Stream A we lock everything down.
drop policy if exists "tenant_storage_select" on storage.objects;
create policy "tenant_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('violations','documents','logos','email-attachments')
    and public.storage_object_tenant_id(name) is not null
    and public.user_has_tenant_access(public.storage_object_tenant_id(name))
  );

drop policy if exists "tenant_storage_insert" on storage.objects;
create policy "tenant_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('violations','documents','logos','email-attachments')
    and public.storage_object_tenant_id(name) is not null
    and public.user_has_tenant_access(public.storage_object_tenant_id(name))
  );

drop policy if exists "tenant_storage_update" on storage.objects;
create policy "tenant_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('violations','documents','logos','email-attachments')
    and public.storage_object_tenant_id(name) is not null
    and public.user_has_tenant_access(public.storage_object_tenant_id(name))
  )
  with check (
    bucket_id in ('violations','documents','logos','email-attachments')
    and public.storage_object_tenant_id(name) is not null
    and public.user_has_tenant_access(public.storage_object_tenant_id(name))
  );

drop policy if exists "tenant_storage_delete" on storage.objects;
create policy "tenant_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('violations','documents','logos','email-attachments')
    and public.storage_object_tenant_id(name) is not null
    and public.user_role_in_tenant(public.storage_object_tenant_id(name)) in ('owner','admin','board')
  );

-- NOTE for Stream G: the existing app uploads to e.g. `violations/<violation_id>/photo.jpg`
-- (no tenant_id prefix). Server actions must be updated to prepend the tenant_id
-- before any new uploads. Existing objects uploaded under the old path layout will
-- become inaccessible to non-service-role clients — Stream G owns the migration script
-- to move them under `violations/<madison_park_uuid>/...`.
