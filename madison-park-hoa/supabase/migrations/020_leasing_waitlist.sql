-- ============================================================
-- 020 — Leasing waitlist + occupancy_type
-- ============================================================
-- Restores the HOA leasing-waitlist feature that lived on `main`
-- before the multi-tenant retrofit. Adds:
--   • properties.occupancy_type ('owner_occupied' | 'rental')
--     used by the rental-cap stat on the admin dashboard
--   • leasing_waitlist table — per-tenant queue of owners waiting
--     for a leasing slot when the rental cap (default 15%) is full
--
-- Tenant-scoped via apply_tenant_rls() like every other business
-- table introduced in Stream A.
-- ============================================================

-- ---------- properties.occupancy_type ----------
alter table public.properties
  add column if not exists occupancy_type text
  check (occupancy_type in ('owner_occupied', 'rental'))
  default 'owner_occupied';

-- ---------- leasing_waitlist ----------
create table if not exists public.leasing_waitlist (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  property_id    uuid not null references public.properties(id) on delete cascade,
  owner_name     text not null,
  owner_email    text,
  owner_phone    text,
  reason         text,
  status         text check (status in ('waiting', 'approved', 'cancelled')) default 'waiting',
  position       int,
  requested_at   timestamptz not null default now(),
  approved_at    timestamptz,
  notes          text,
  created_by     uuid references public.profiles(id)
);

create index if not exists idx_leasing_waitlist_tenant on public.leasing_waitlist(tenant_id);
create index if not exists idx_leasing_waitlist_status on public.leasing_waitlist(status);
create index if not exists idx_leasing_waitlist_position on public.leasing_waitlist(position);

select public.apply_tenant_rls('leasing_waitlist');
