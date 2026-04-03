-- ============================================
-- 007 — Email attachments & activity logging
-- ============================================

-- 1. Add attachments column to letters table (JSON array of attachment metadata)
alter table letters
  add column if not exists attachments jsonb default '[]';

-- 2. Email attachments storage bucket — private, authenticated only
insert into storage.buckets (id, name, public)
values ('email-attachments', 'email-attachments', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload email attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'email-attachments'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can view email attachments"
  on storage.objects for select
  using (
    bucket_id = 'email-attachments'
    and auth.role() = 'authenticated'
  );

create policy "Admin/board can delete email attachments"
  on storage.objects for delete
  using (
    bucket_id = 'email-attachments'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );
