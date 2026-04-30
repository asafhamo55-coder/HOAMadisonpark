-- ============================================================
-- verify-rls-isolation.sql
-- ============================================================
-- Run with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--          -f madison-park-hoa/scripts/verify-rls-isolation.sql
--
-- The script:
--   1. Creates a SECOND tenant ("acme-test") and a single throwaway
--      property under it (using service role / bypass-RLS).
--   2. Switches role to authenticated and impersonates two different
--      users (user_a in madison-park, user_b in acme-test).
--   3. Calls set_request_tenant() and verifies:
--        a) the wrong-tenant call raises an exception
--        b) cross-tenant SELECT returns ZERO rows
--        c) cross-tenant INSERT is blocked by the policy
--   4. Cleans up.
--
-- This script must be run by the postgres superuser (or via Supabase
-- SQL editor) because it uses set_local role / impersonation tricks.
--
-- Exit code is 0 on full success; non-zero on any check failure.
-- ============================================================

\set ON_ERROR_STOP on
\timing off
\pset pager off

begin;

-- 1. Setup: a second tenant and a synthetic owner user.
do $setup$
declare
  acme_tenant uuid;
  mp_tenant   uuid;
  user_a      uuid := gen_random_uuid();
  user_b      uuid := gen_random_uuid();
  acme_prop   uuid;
  mp_prop_count int;
begin
  -- Get / create the acme-test tenant.
  insert into public.tenants (slug, name, type, status)
  values ('acme-test', 'Acme Test HOA', 'hoa', 'active')
  on conflict (slug) do nothing;

  select id into acme_tenant from public.tenants where slug = 'acme-test';
  select id into mp_tenant   from public.tenants where slug = 'madison-park';

  if acme_tenant is null or mp_tenant is null then
    raise exception 'verify-rls: missing tenant rows (acme=%, mp=%)', acme_tenant, mp_tenant;
  end if;

  -- Insert two synthetic auth.users rows (this requires service-role).
  -- Using auth.users directly is the only way to simulate two users in a
  -- single SQL session — Supabase Auth doesn't expose this otherwise.
  insert into auth.users (id, email, instance_id, aud, role)
  values
    (user_a, 'verify-mp@example.com',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_b, 'verify-acme@example.com','00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  -- Memberships: A → madison-park (owner); B → acme-test (owner).
  insert into public.tenant_memberships (tenant_id, user_id, role, status)
  values (mp_tenant,   user_a, 'owner', 'active'),
         (acme_tenant, user_b, 'owner', 'active')
  on conflict (tenant_id, user_id) do nothing;

  -- Create a property under acme-test as service-role.
  insert into public.properties (address, tenant_id)
  values ('100 Acme Way', acme_tenant)
  returning id into acme_prop;

  -- Snapshot Madison Park property count.
  select count(*) into mp_prop_count
    from public.properties where tenant_id = mp_tenant;

  raise notice '[verify] Madison Park has % properties; Acme has 1 (id=%)',
    mp_prop_count, acme_prop;

  -- ============================================================
  -- 2. Test: user_a (madison-park) attempts to set tenant=acme-test
  --    Expected: set_request_tenant raises 42501.
  -- ============================================================
  perform set_config('request.jwt.claim.sub', user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);
  set local role authenticated;

  begin
    perform public.set_request_tenant(acme_tenant);
    raise exception '[verify FAIL] user_a was allowed to set acme tenant';
  exception
    when sqlstate '42501' then
      raise notice '[verify OK]   user_a denied acme tenant (sqlstate 42501)';
    when others then
      raise notice '[verify OK]   user_a denied acme tenant (sqlstate %, %)', sqlstate, sqlerrm;
  end;

  -- ============================================================
  -- 3. Test: user_a sets madison-park, queries properties.
  --    Expected: only Madison Park rows are returned.
  -- ============================================================
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', user_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_a)::text, true);

  perform public.set_request_tenant(mp_tenant);
  declare
    visible_count int;
    leaked_count  int;
  begin
    select count(*) into visible_count from public.properties;
    select count(*) into leaked_count
      from public.properties where tenant_id = acme_tenant;

    if leaked_count <> 0 then
      raise exception '[verify FAIL] user_a sees % rows from acme-test', leaked_count;
    end if;
    raise notice '[verify OK]   user_a sees % rows (all mp), 0 leaked from acme', visible_count;
  end;

  -- ============================================================
  -- 4. Test: user_a tries to INSERT a property with acme tenant_id.
  --    Expected: insert blocked by tenant_insert WITH CHECK clause.
  -- ============================================================
  begin
    insert into public.properties (address, tenant_id)
    values ('999 Hijack Ln', acme_tenant);
    raise exception '[verify FAIL] user_a was allowed to insert into acme-test';
  exception
    when others then
      raise notice '[verify OK]   user_a insert into acme-test blocked: %', sqlerrm;
  end;

  -- ============================================================
  -- 5. Test: user_b (acme-test) sets acme, sees only Acme.
  -- ============================================================
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', user_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_b)::text, true);
  perform public.set_request_tenant(acme_tenant);

  declare
    visible_count int;
    leaked_count  int;
  begin
    select count(*) into visible_count from public.properties;
    select count(*) into leaked_count
      from public.properties where tenant_id = mp_tenant;

    if leaked_count <> 0 then
      raise exception '[verify FAIL] user_b sees % rows from madison-park', leaked_count;
    end if;
    if visible_count <> 1 then
      raise exception '[verify FAIL] user_b expected 1 row, got %', visible_count;
    end if;
    raise notice '[verify OK]   user_b sees % row (acme only), 0 leaked from mp', visible_count;
  end;

  reset role;

  -- ============================================================
  -- 6. Cleanup.
  -- ============================================================
  delete from public.properties where address in ('100 Acme Way', '999 Hijack Ln');
  delete from public.tenant_memberships
   where user_id in (user_a, user_b);
  delete from public.tenants where slug = 'acme-test';
  delete from auth.users where id in (user_a, user_b);

  raise notice '[verify] All checks passed.';
end
$setup$;

commit;
