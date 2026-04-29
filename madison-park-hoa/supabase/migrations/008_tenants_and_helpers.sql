-- ============================================================
-- 008 — Multi-tenant core: tenants, memberships, invitations
--                          + helper functions + RLS template
-- ============================================================
-- Stream A — Foundation & Multi-Tenant Core
--
-- Creates the spine for the multi-tenant platform without
-- touching existing single-tenant Madison Park data yet.
-- Backfill happens in migration 010.
-- ============================================================

-- Required extensions (idempotent)
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- TENANTS
-- ============================================================
create table if not exists public.tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  legal_name      text,
  type            text check (type in ('hoa','coa','master','townhome','condo','sub')) default 'hoa',
  status          text check (status in ('trial','active','past_due','suspended','cancelled')) default 'trial',
  plan_id         text,                                       -- FK added in Stream D when `plans` table exists
  trial_ends_at   timestamptz,
  primary_owner   uuid references auth.users on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

comment on table public.tenants is
  'Top-level customer record. One row per HOA/COA. Slug appears in URLs.';
comment on column public.tenants.slug is
  'URL-safe identifier. Collisions across states are resolved by appending the state code, e.g. "sunset-ridge-ga".';
comment on column public.tenants.plan_id is
  'References plans(id); FK constraint added in Stream D once the plans table exists.';

create index if not exists idx_tenants_slug on public.tenants(slug);
create index if not exists idx_tenants_status on public.tenants(status) where deleted_at is null;

-- ============================================================
-- TENANT MEMBERSHIPS
-- ============================================================
create table if not exists public.tenant_memberships (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text check (role in ('owner','admin','board','committee','resident','vendor','readonly')) not null,
  resident_id  uuid,                                          -- FK to residents added in 010 after tenant_id is on residents
  status       text check (status in ('active','invited','suspended')) not null default 'active',
  invited_by   uuid references auth.users on delete set null,
  joined_at    timestamptz not null default now(),
  unique (tenant_id, user_id)
);

comment on table public.tenant_memberships is
  'Links auth.users to tenants. A single user can belong to multiple tenants with different roles.';

create index if not exists idx_memberships_user on public.tenant_memberships(user_id);
create index if not exists idx_memberships_tenant on public.tenant_memberships(tenant_id);
create index if not exists idx_memberships_active on public.tenant_memberships(tenant_id, user_id) where status = 'active';

-- ============================================================
-- TENANT INVITATIONS
-- ============================================================
create table if not exists public.tenant_invitations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants on delete cascade,
  email        text not null,
  role         text not null check (role in ('owner','admin','board','committee','resident','vendor','readonly')),
  token        text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by   uuid references auth.users on delete set null,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_invitations_token on public.tenant_invitations(token);
create index if not exists idx_invitations_tenant_email on public.tenant_invitations(tenant_id, email);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- current_tenant_id()
-- Returns the tenant id pinned to the current request via
-- set_request_tenant(). Returns NULL if no tenant context yet.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select nullif(current_setting('request.tenant_id', true), '')::uuid;
$$;

-- user_has_tenant_access(t)
-- True iff auth.uid() is an active member of tenant t.
create or replace function public.user_has_tenant_access(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tenant_memberships
    where tenant_id = t
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

-- user_role_in_tenant(t)
-- Returns the role string for the active membership, or NULL.
create or replace function public.user_role_in_tenant(t uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.tenant_memberships
  where tenant_id = t and user_id = auth.uid() and status = 'active'
  limit 1;
$$;

-- set_request_tenant(t)
-- Pins tenant id to the current request. Raises on access violation.
-- Called from lib/tenant.ts at the start of every server action / route handler.
create or replace function public.set_request_tenant(t uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if t is null then
    raise exception 'set_request_tenant: tenant id cannot be null';
  end if;
  if not public.user_has_tenant_access(t) then
    raise exception 'Access denied to tenant %', t using errcode = '42501';
  end if;
  perform set_config('request.tenant_id', t::text, true);
end;
$$;

-- apply_tenant_rls(table_name)
-- Enables RLS and installs the standard 4 policies on a business table.
-- Drops any pre-existing policies with the same names first so the function
-- is idempotent across migrations.
create or replace function public.apply_tenant_rls(table_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  execute format('alter table public.%I enable row level security', table_name);

  execute format('drop policy if exists tenant_select on public.%I', table_name);
  execute format('drop policy if exists tenant_insert on public.%I', table_name);
  execute format('drop policy if exists tenant_update on public.%I', table_name);
  execute format('drop policy if exists tenant_delete on public.%I', table_name);

  execute format($p$
    create policy tenant_select on public.%I for select
      using (tenant_id = public.current_tenant_id()
             and public.user_has_tenant_access(tenant_id))
  $p$, table_name);

  execute format($p$
    create policy tenant_insert on public.%I for insert
      with check (tenant_id = public.current_tenant_id()
                  and public.user_has_tenant_access(tenant_id))
  $p$, table_name);

  execute format($p$
    create policy tenant_update on public.%I for update
      using (tenant_id = public.current_tenant_id()
             and public.user_has_tenant_access(tenant_id))
      with check (tenant_id = public.current_tenant_id())
  $p$, table_name);

  execute format($p$
    create policy tenant_delete on public.%I for delete
      using (tenant_id = public.current_tenant_id()
             and public.user_role_in_tenant(tenant_id) in ('owner','admin'))
  $p$, table_name);
end;
$$;

comment on function public.apply_tenant_rls(text) is
  'Installs the standard 4-policy tenant clamp on the named table. Idempotent.';

-- set_updated_at()
-- Generic trigger function for `updated_at` columns.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trigger on tenants table for updated_at
drop trigger if exists tenants_updated_at on public.tenants;
create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS on the new tenant tables themselves
-- ============================================================
-- Special policies — these tables are NOT scoped by tenant_id
-- (the membership row IS the access grant), so we don't use
-- apply_tenant_rls() here.

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_invitations enable row level security;

-- TENANTS: a user can read tenants they are a member of.
drop policy if exists tenants_member_read on public.tenants;
create policy tenants_member_read on public.tenants for select
  using (public.user_has_tenant_access(id));

-- TENANT_MEMBERSHIPS: a user can read their own memberships,
-- and tenant owners/admins can read all memberships in their tenant.
drop policy if exists memberships_self_read on public.tenant_memberships;
create policy memberships_self_read on public.tenant_memberships for select
  using (user_id = auth.uid());

drop policy if exists memberships_admin_read on public.tenant_memberships;
create policy memberships_admin_read on public.tenant_memberships for select
  using (public.user_role_in_tenant(tenant_id) in ('owner','admin'));

drop policy if exists memberships_admin_write on public.tenant_memberships;
create policy memberships_admin_write on public.tenant_memberships for all
  using (public.user_role_in_tenant(tenant_id) in ('owner','admin'))
  with check (public.user_role_in_tenant(tenant_id) in ('owner','admin'));

-- TENANT_INVITATIONS: tenant owners/admins manage invitations.
-- Reading by token is done via service role in the invitation acceptance handler.
drop policy if exists invitations_admin_all on public.tenant_invitations;
create policy invitations_admin_all on public.tenant_invitations for all
  using (public.user_role_in_tenant(tenant_id) in ('owner','admin'))
  with check (public.user_role_in_tenant(tenant_id) in ('owner','admin'));

-- Grant execute on helper functions to authenticated users.
grant execute on function public.current_tenant_id() to authenticated, anon;
grant execute on function public.user_has_tenant_access(uuid) to authenticated;
grant execute on function public.user_role_in_tenant(uuid) to authenticated;
grant execute on function public.set_request_tenant(uuid) to authenticated;
grant execute on function public.apply_tenant_rls(text) to service_role;
