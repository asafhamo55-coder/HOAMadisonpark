-- ============================================================
-- 017 — Multi-product entitlements: tenant_modules
-- ============================================================
-- Tracks which Homeowner Hub products each tenant has enabled.
-- Default for the existing Madison Park tenant: hoa.
--
-- The HOA Pro Hub UI today only assumes 'hoa'. The Property Management
-- and Eviction Hub modules become entitlement-gated once their UI lands
-- (migrations 018 and 019). Routes under /[slug]/property and
-- /[slug]/eviction must call tenant_has_module() before rendering.
-- ============================================================

create table if not exists public.tenant_modules (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  module          text not null check (module in ('hoa','property','eviction')),
  status          text not null check (status in ('active','trial','suspended','cancelled'))
                  default 'trial',
  trial_ends_at   timestamptz,
  enabled_at      timestamptz not null default now(),
  unique (tenant_id, module)
);

create index if not exists idx_tenant_modules_tenant on public.tenant_modules(tenant_id);

-- Standard tenant RLS — same 4-policy template as every other business table.
select public.apply_tenant_rls('tenant_modules');

-- ============================================================
-- Helper: tenant_has_module(tenant_id, module)
-- ============================================================
-- True iff the tenant has the named module in active|trial state.
-- Called by ev_* and pm_* read/write paths in the app layer.
create or replace function public.tenant_has_module(t uuid, mod text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tenant_modules
    where tenant_id = t
      and module = mod
      and status in ('active','trial')
  );
$$;

-- ============================================================
-- Backfill: every existing tenant gets the HOA module active.
-- (Today this is just Madison Park.)
-- ============================================================
insert into public.tenant_modules (tenant_id, module, status, trial_ends_at)
select id, 'hoa', 'active', null
from public.tenants
where deleted_at is null
on conflict (tenant_id, module) do nothing;
