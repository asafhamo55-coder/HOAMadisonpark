-- ============================================================
-- 010 — Add tenant_id to existing tables, backfill Madison Park,
--       enforce NOT NULL, apply standard RLS clamp
-- ============================================================
-- Stream A — Foundation & Multi-Tenant Core
--
-- This migration is the moment Madison Park stops being a
-- single-tenant app. Row counts are captured BEFORE and AFTER
-- the backfill into public.tenant_backfill_audit so we can
-- verify zero data loss.
--
-- Notes:
--   • `profiles` is NOT tenant-scoped (one row per auth.users).
--     Per-tenant role lives in `tenant_memberships`.
--   • `email_templates` is the existing table that maps to the
--     spec's `letter_templates`.
--   • `notifications` is per-user but we still tenant-scope it
--     because notifications are emitted by per-tenant events.
--   • `arc_requests` is dropped from the list — it does not yet
--     exist in this codebase. Stream H builds it.
-- ============================================================

-- ============================================================
-- 0. Audit log for the backfill itself
-- ============================================================
create table if not exists public.tenant_backfill_audit (
  id              bigserial primary key,
  table_name      text not null,
  rows_before     bigint not null,
  rows_after      bigint not null,
  rows_with_tenant bigint not null,
  ran_at          timestamptz not null default now(),
  notes           text
);

-- ============================================================
-- 1. Create the Madison Park tenant
-- ============================================================
insert into public.tenants (slug, name, legal_name, type, status)
values (
  'madison-park',
  'Madison Park HOA',
  'Madison Park Property Owners'' Association, Inc.',
  'hoa',
  'active'
)
on conflict (slug) do nothing;

-- ============================================================
-- 2. Backfill tenant_id on every existing business table
-- ============================================================
do $$
declare
  mp_id        uuid;
  tbl          text;
  cnt_before   bigint;
  cnt_after    bigint;
  cnt_tenant   bigint;
  table_list   text[] := array[
    'properties',
    'residents',
    'violations',
    'letters',
    'vendors',
    'vendor_jobs',
    'announcements',
    'documents',
    'payments',
    'requests',
    'notifications',
    'hoa_settings',
    'email_templates',
    'audit_log'
  ];
begin
  select id into mp_id from public.tenants where slug = 'madison-park';
  if mp_id is null then
    raise exception 'Madison Park tenant not found — cannot backfill';
  end if;

  foreach tbl in array table_list loop
    -- Skip silently if the table doesn't exist (defensive — supports partial schemas).
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      raise notice 'Table %: skipped (does not exist)', tbl;
      continue;
    end if;

    -- Capture row count BEFORE
    execute format('select count(*) from public.%I', tbl) into cnt_before;

    -- Add tenant_id column if missing
    execute format(
      'alter table public.%I add column if not exists tenant_id uuid references public.tenants on delete cascade',
      tbl
    );

    -- Backfill: every existing row belongs to Madison Park
    execute format('update public.%I set tenant_id = %L where tenant_id is null', tbl, mp_id);

    -- Capture row count AFTER (must equal before — backfill is in-place)
    execute format('select count(*) from public.%I', tbl) into cnt_after;
    execute format('select count(*) from public.%I where tenant_id is not null', tbl) into cnt_tenant;

    -- Sanity check: counts must match
    if cnt_before <> cnt_after then
      raise exception 'Row count mismatch on %: before=% after=%', tbl, cnt_before, cnt_after;
    end if;
    if cnt_tenant <> cnt_after then
      raise exception 'Backfill incomplete on %: % rows still missing tenant_id', tbl, (cnt_after - cnt_tenant);
    end if;

    -- Now we can safely set NOT NULL
    execute format('alter table public.%I alter column tenant_id set not null', tbl);

    -- Composite index per the convention in 09-data-model.md
    -- (created_at exists on every table — confirmed in BUILD-LOG inventory).
    execute format(
      'create index if not exists idx_%I_tenant_created on public.%I(tenant_id, created_at desc)',
      tbl, tbl
    );

    -- Record the audit row
    insert into public.tenant_backfill_audit
      (table_name, rows_before, rows_after, rows_with_tenant, notes)
    values
      (tbl, cnt_before, cnt_after, cnt_tenant,
       format('Backfilled to madison-park (%s)', mp_id));

    raise notice 'Table %: % rows backfilled to madison-park', tbl, cnt_after;
  end loop;
end $$;

-- ============================================================
-- 3. Drop legacy single-tenant RLS policies on backfilled tables
-- ============================================================
-- The existing migrations 001/002/003/004 installed role-based
-- policies (admin/board/resident/vendor). Those still work for
-- single-tenant Madison Park but they let admins read across all
-- tenants once we have more than one. Drop them and replace with
-- the standard tenant clamp from apply_tenant_rls().
--
-- We list policies explicitly (rather than dynamic discovery) so
-- the rollback story is unambiguous.

-- properties
drop policy if exists "properties_admin_board_all" on public.properties;
drop policy if exists "properties_resident_read" on public.properties;

-- residents
drop policy if exists "residents_admin_board_all" on public.residents;
drop policy if exists "residents_self_read" on public.residents;

-- violations
drop policy if exists "violations_admin_board_all" on public.violations;
drop policy if exists "violations_resident_read" on public.violations;

-- letters
drop policy if exists "letters_admin_board_all" on public.letters;
drop policy if exists "letters_resident_read" on public.letters;

-- vendors
drop policy if exists "vendors_admin_board_all" on public.vendors;
drop policy if exists "vendors_self_read" on public.vendors;
drop policy if exists "vendors_self_update" on public.vendors;

-- vendor_jobs
drop policy if exists "vendor_jobs_admin_board_all" on public.vendor_jobs;
drop policy if exists "vendor_jobs_vendor_read" on public.vendor_jobs;

-- announcements
drop policy if exists "announcements_admin_board_all" on public.announcements;
drop policy if exists "announcements_authed_read" on public.announcements;

-- documents
drop policy if exists "documents_admin_board_all" on public.documents;
drop policy if exists "documents_authed_read_public" on public.documents;

-- payments
drop policy if exists "payments_admin_board_all" on public.payments;
drop policy if exists "payments_resident_read" on public.payments;

-- email_templates
drop policy if exists "email_templates_admin_board_all" on public.email_templates;

-- hoa_settings
drop policy if exists "Admin/board can read settings" on public.hoa_settings;
drop policy if exists "Admin can modify settings" on public.hoa_settings;

-- audit_log
drop policy if exists "Admin/board can read audit log" on public.audit_log;
drop policy if exists "Admin can insert audit log" on public.audit_log;

-- requests
drop policy if exists "Admin/board full access to requests" on public.requests;
drop policy if exists "Residents read own requests" on public.requests;
drop policy if exists "Residents insert requests" on public.requests;

-- notifications — the existing policies are user-scoped, NOT role-scoped,
-- and they still make sense in a multi-tenant world (a notification belongs
-- to a single user). We keep them, and add the tenant clamp on top so a
-- user only sees notifications from tenants they are still active in.
-- (No drops here.)

-- ============================================================
-- 4. Apply the standard tenant clamp to every backfilled table
-- ============================================================
select public.apply_tenant_rls('properties');
select public.apply_tenant_rls('residents');
select public.apply_tenant_rls('violations');
select public.apply_tenant_rls('letters');
select public.apply_tenant_rls('vendors');
select public.apply_tenant_rls('vendor_jobs');
select public.apply_tenant_rls('announcements');
select public.apply_tenant_rls('documents');
select public.apply_tenant_rls('payments');
select public.apply_tenant_rls('requests');
select public.apply_tenant_rls('notifications');
select public.apply_tenant_rls('hoa_settings');
select public.apply_tenant_rls('email_templates');
select public.apply_tenant_rls('audit_log');

-- ============================================================
-- 5. Make Asaf a tenant_membership owner if his auth user exists
-- ============================================================
-- The seed admin script (scripts/seed-admin.ts) creates an admin profile.
-- We promote anyone whose role is 'admin' OR 'board' to a tenant owner
-- of madison-park so existing logins keep working immediately.
do $$
declare
  mp_id uuid;
begin
  select id into mp_id from public.tenants where slug = 'madison-park';

  insert into public.tenant_memberships (tenant_id, user_id, role, status)
  select mp_id, p.id,
         case when p.role in ('admin','board') then 'owner' else 'resident' end,
         'active'
    from public.profiles p
   where p.id is not null
     and not exists (
       select 1 from public.tenant_memberships m
        where m.tenant_id = mp_id and m.user_id = p.id
     );
end $$;

-- ============================================================
-- 6. Wire FK from tenant_memberships.resident_id → residents.id
-- ============================================================
-- Deferred from migration 008 because residents needed tenant_id first.
do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
     where table_schema = 'public'
       and table_name = 'residents'
       and constraint_name = 'tenant_memberships_resident_id_fkey'
  ) then
    alter table public.tenant_memberships
      add constraint tenant_memberships_resident_id_fkey
      foreign key (resident_id) references public.residents on delete set null;
  end if;
end $$;

-- ============================================================
-- 7. updated_at triggers on the new tables (where the column exists)
-- ============================================================
-- (set_updated_at() was created in migration 008.)

-- properties already has trg_properties_updated_at from 006
-- residents already has trg_residents_updated_at from 006

-- ============================================================
-- DONE. Inspect results with:
--   select * from public.tenant_backfill_audit order by id;
-- ============================================================
