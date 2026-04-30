-- ============================================================
-- 016 — Fix RLS policies to not depend on transaction-scoped session var
-- ============================================================
-- Stream A's policies clamp via `tenant_id = current_tenant_id()` AND
-- `user_has_tenant_access(tenant_id)`. The first half reads a Postgres
-- session var pinned by `set_request_tenant(t)` using
-- `set_config(..., true)` — meaning LOCAL to the current transaction.
--
-- Supabase / PostgREST run each HTTP query in its own transaction,
-- so by the time the app fires `from('properties').select(...)`, the
-- session var pinned by the earlier RPC call is already gone, the
-- predicate becomes `tenant_id = NULL`, and zero rows are returned.
--
-- Fix: drop the `current_tenant_id()` check. `user_has_tenant_access`
-- already verifies the caller is an active member of the row's tenant,
-- which is the actual security invariant. The "active workspace"
-- concept is enforced at the app level via the URL slug + middleware.
--
-- This migration is idempotent — re-applying is safe.
-- ============================================================

-- ============================================================
-- 1. Replace the apply_tenant_rls() helper
-- ============================================================
create or replace function public.apply_tenant_rls(table_name text)
returns void
language plpgsql
as $$
begin
  -- Enable RLS
  execute format('alter table public.%I enable row level security', table_name);

  -- Drop any prior versions
  execute format('drop policy if exists "tenant_select" on public.%I', table_name);
  execute format('drop policy if exists "tenant_insert" on public.%I', table_name);
  execute format('drop policy if exists "tenant_update" on public.%I', table_name);
  execute format('drop policy if exists "tenant_delete" on public.%I', table_name);

  -- New policies: only require active membership for the row's tenant.
  execute format(
    'create policy "tenant_select" on public.%I for select using (public.user_has_tenant_access(tenant_id))',
    table_name
  );
  execute format(
    'create policy "tenant_insert" on public.%I for insert with check (public.user_has_tenant_access(tenant_id))',
    table_name
  );
  execute format(
    'create policy "tenant_update" on public.%I for update using (public.user_has_tenant_access(tenant_id)) with check (public.user_has_tenant_access(tenant_id))',
    table_name
  );
  execute format(
    'create policy "tenant_delete" on public.%I for delete using (public.user_has_tenant_access(tenant_id) and public.user_role_in_tenant(tenant_id) in (''owner'',''admin''))',
    table_name
  );
end;
$$;

-- ============================================================
-- 2. Re-apply on every tenant-scoped table
-- ============================================================
do $$
declare
  tbl text;
  table_list text[] := array[
    -- Stream A backfilled tables
    'properties','residents','violations','letters','vendors','vendor_jobs',
    'announcements','documents','payments','requests','notifications',
    'hoa_settings','email_templates','audit_log',
    -- Stream A tenant tables (memberships need direct policies, not the standard 4)
    -- Stream D
    'subscriptions','invoices','usage_events','addons',
    -- Stream E
    'tenant_settings','tenant_knowledge_base','letter_templates',
    'letter_template_versions','violation_categories',
    -- Stream C
    'onboarding_progress',
    -- Audit
    'tenant_backfill_audit'
  ];
begin
  foreach tbl in array table_list loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = tbl and column_name = 'tenant_id'
    ) then
      perform public.apply_tenant_rls(tbl);
      raise notice 'RLS reapplied on %', tbl;
    else
      raise notice 'Skipped % (table missing or no tenant_id column)', tbl;
    end if;
  end loop;
end $$;
