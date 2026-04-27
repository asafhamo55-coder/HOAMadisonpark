-- ============================================
-- 010 — Leasing waitlist table
-- ============================================

create table if not exists leasing_waitlist (
  id             uuid default gen_random_uuid() primary key,
  property_id    uuid references properties on delete cascade not null,
  owner_name     text not null,
  owner_email    text,
  owner_phone    text,
  reason         text,
  status         text check (status in ('waiting', 'approved', 'cancelled')) default 'waiting',
  position       int,
  requested_at   timestamptz default now(),
  approved_at    timestamptz,
  notes          text,
  created_by     uuid references profiles
);

alter table leasing_waitlist enable row level security;

create policy "leasing_waitlist_admin_board_all"
  on leasing_waitlist for all
  using (public.get_user_role() in ('admin', 'board'))
  with check (public.get_user_role() in ('admin', 'board'));

create index idx_leasing_waitlist_status on leasing_waitlist(status);
create index idx_leasing_waitlist_position on leasing_waitlist(position);
