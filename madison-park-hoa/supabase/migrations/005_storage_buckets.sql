-- ============================================
-- 005 — Supabase Storage buckets & policies
-- ============================================

-- 1. Violations bucket — private, authenticated only
insert into storage.buckets (id, name, public)
values ('violations', 'violations', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload violation photos"
  on storage.objects for insert
  with check (
    bucket_id = 'violations'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can view violation photos"
  on storage.objects for select
  using (
    bucket_id = 'violations'
    and auth.role() = 'authenticated'
  );

create policy "Admin/board can delete violation photos"
  on storage.objects for delete
  using (
    bucket_id = 'violations'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );

-- 2. Documents bucket — public read, authenticated write
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Anyone can read documents"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
  );

create policy "Admin/board can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );

-- 3. Logos bucket — public read, admin write
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Anyone can read logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Admin can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy "Admin can delete logos"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
