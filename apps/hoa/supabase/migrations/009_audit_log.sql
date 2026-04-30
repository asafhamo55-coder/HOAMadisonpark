-- ============================================================
-- 009 — Audit logging tables
-- ============================================================
-- Stream A — Foundation & Multi-Tenant Core
--
-- Reshapes the existing single-tenant `audit_log` table to the
-- multi-tenant schema (preserves existing rows) and creates the
-- separate `platform_audit_log` table for service-role / cross-tenant
-- actions performed via lib/admin.ts.
-- ============================================================

-- ============================================================
-- AUDIT_LOG — per-tenant audit trail
-- ============================================================
-- Bring the existing 002-era audit_log up to the multi-tenant spec.
-- The original schema (uuid id, user_id, user_name, action, entity_type,
-- entity_id, details, created_at) is forward-compatible: we just add
-- the new columns and let migration 010 backfill tenant_id.

alter table public.audit_log
  add column if not exists tenant_id   uuid references public.tenants on delete cascade,
  add column if not exists actor_id    uuid references auth.users,
  add column if not exists actor_email text,
  add column if not exists entity      text,
  add column if not exists metadata    jsonb,
  add column if not exists ip_address  inet,
  add column if not exists user_agent  text;

-- Backfill: copy the legacy columns into the new ones so downstream code
-- can read either name. (We keep both columns so the existing app keeps
-- working until Stream G migrates server actions.)
update public.audit_log
   set actor_id = user_id
 where actor_id is null and user_id is not null;

update public.audit_log
   set actor_email = user_name
 where actor_email is null and user_name is not null;

update public.audit_log
   set entity = entity_type
 where entity is null and entity_type is not null;

update public.audit_log
   set metadata = details
 where metadata is null and details is not null;

create index if not exists idx_audit_log_tenant_created
  on public.audit_log(tenant_id, created_at desc);
create index if not exists idx_audit_log_actor
  on public.audit_log(actor_id, created_at desc);

comment on table public.audit_log is
  'Per-tenant audit trail. Written by lib/audit.ts wrappers and trigger functions on sensitive tables.';
comment on column public.audit_log.tenant_id is
  'Made NOT NULL by migration 010 after Madison Park backfill.';

-- ============================================================
-- PLATFORM_AUDIT_LOG — cross-tenant / service-role actions
-- ============================================================
-- Anything done via lib/admin.ts (service-role bypass of RLS) MUST
-- write a row here so platform admins (Asaf) can audit themselves.

create table if not exists public.platform_audit_log (
  id          bigserial primary key,
  tenant_id   uuid references public.tenants on delete set null,    -- nullable: some platform actions are not tenant-scoped
  actor_id    uuid references auth.users,
  actor_email text,
  action      text not null,
  reason      text,                                                  -- free-form justification
  entity      text,
  entity_id   text,                                                  -- text not uuid — entity ids may be composite
  before      jsonb,
  after       jsonb,
  metadata    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_platform_audit_tenant_created
  on public.platform_audit_log(tenant_id, created_at desc);
create index if not exists idx_platform_audit_action
  on public.platform_audit_log(action, created_at desc);
create index if not exists idx_platform_audit_actor
  on public.platform_audit_log(actor_id, created_at desc);

comment on table public.platform_audit_log is
  'Cross-tenant audit trail for service-role actions performed via lib/admin.ts. Readable only by platform owners.';

-- ============================================================
-- RLS on audit tables
-- ============================================================

-- audit_log will get the standard tenant clamp via apply_tenant_rls()
-- once tenant_id is NOT NULL (handled in migration 010).

-- platform_audit_log: platform owners only.
-- A "platform owner" is anyone with role='owner' in ANY tenant whose slug
-- is the special platform tenant — but we don't have that yet, so for v1
-- we restrict reads to service_role only and keep platform admin UI behind
-- service_role.

alter table public.platform_audit_log enable row level security;

drop policy if exists platform_audit_no_anon_select on public.platform_audit_log;
create policy platform_audit_no_anon_select on public.platform_audit_log
  for select to authenticated
  using (false);                       -- service_role bypasses RLS, blocks everyone else

drop policy if exists platform_audit_no_anon_write on public.platform_audit_log;
create policy platform_audit_no_anon_write on public.platform_audit_log
  for all to authenticated
  using (false) with check (false);    -- only service_role can write
