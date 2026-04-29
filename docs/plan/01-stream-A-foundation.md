# Stream A — Foundation & Multi-Tenant Core
**Agent:** `arch-agent`
**Depends on:** nothing — this is the spine
**Goal:** Convert the existing single-tenant Madison Park codebase into a multi-tenant platform with strict isolation, without breaking Madison Park.

---

## Deliverables

1. New `tenants`, `tenant_memberships`, `tenant_invitations` tables.
2. Tenant resolver middleware that maps URL → tenant context.
3. Supabase RLS framework: every business table protected by tenant clamp.
4. Auth flows that handle multi-tenant membership.
5. Service-role helpers that NEVER leak across tenants.
6. Madison Park promoted to be tenant `madison-park` with all existing data backfilled.
7. Branch-based migration with rollback plan.

---

## Tasks

### A1. Tenant tables

```sql
create table tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                         -- 'madison-park'
  name            text not null,                                 -- 'Madison Park HOA'
  legal_name      text,
  type            text check (type in ('hoa','coa','master','townhome','condo','sub')) default 'hoa',
  status          text check (status in ('trial','active','past_due','suspended','cancelled')) default 'trial',
  plan_id         text references plans(id),
  trial_ends_at   timestamptz,
  primary_owner   uuid references auth.users,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz
);

create table tenant_memberships (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text check (role in ('owner','admin','board','committee','resident','vendor','readonly')) not null,
  resident_id  uuid,                                             -- if role='resident', link to residents
  status       text check (status in ('active','invited','suspended')) default 'active',
  invited_by   uuid references auth.users,
  joined_at    timestamptz default now(),
  unique (tenant_id, user_id)
);

create table tenant_invitations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants on delete cascade,
  email        text not null,
  role         text not null,
  token        text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by   uuid references auth.users,
  expires_at   timestamptz default (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz default now()
);

create index idx_memberships_user on tenant_memberships(user_id);
create index idx_memberships_tenant on tenant_memberships(tenant_id);
```

### A2. Helper functions (run as SECURITY DEFINER)

```sql
create or replace function current_tenant_id()
returns uuid
language sql stable
as $$
  select (current_setting('request.tenant_id', true))::uuid;
$$;

create or replace function user_has_tenant_access(t uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from tenant_memberships
    where tenant_id = t
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function user_role_in_tenant(t uuid)
returns text
language sql stable
as $$
  select role from tenant_memberships
  where tenant_id = t and user_id = auth.uid() and status = 'active';
$$;
```

### A3. Standard RLS policy template

Every business table gets four policies. Codify this as a migration helper:

```sql
-- Replace TABLE with the actual table name
alter table TABLE enable row level security;

create policy "tenant_select" on TABLE for select
  using (tenant_id = current_tenant_id() and user_has_tenant_access(tenant_id));

create policy "tenant_insert" on TABLE for insert
  with check (tenant_id = current_tenant_id() and user_has_tenant_access(tenant_id));

create policy "tenant_update" on TABLE for update
  using (tenant_id = current_tenant_id() and user_has_tenant_access(tenant_id))
  with check (tenant_id = current_tenant_id());

create policy "tenant_delete" on TABLE for delete
  using (tenant_id = current_tenant_id()
         and user_role_in_tenant(tenant_id) in ('owner','admin'));
```

Write a SQL function `apply_tenant_rls(table_name text)` that does this in one call so migrations are concise.

### A4. Tenant resolver middleware

`middleware.ts` runs on every request. Resolve tenant from:

1. Path segment (`/[tenant]/...`)
2. Subdomain (future)
3. Custom domain map (future)

```ts
// middleware.ts (excerpt)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const { pathname, hostname } = new URL(req.url)
  const segments = pathname.split('/').filter(Boolean)

  // Public routes
  const publicPaths = ['', 'pricing', 'signup', 'login', 'demo', 'about', 'legal']
  if (publicPaths.includes(segments[0] ?? '')) return NextResponse.next()

  // Platform console (Asaf only)
  if (segments[0] === 'platform') return platformGuard(req)

  // Onboarding (no tenant yet)
  if (segments[0] === 'onboarding') return authGuard(req)

  // Tenant workspace: /[tenantSlug]/...
  const tenantSlug = segments[0]
  const supabase = createSupabaseFromReq(req)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, status')
    .eq('slug', tenantSlug)
    .is('deleted_at', null)
    .single()

  if (!tenant) return NextResponse.redirect(new URL('/404', req.url))
  if (tenant.status === 'suspended') return NextResponse.redirect(new URL('/suspended', req.url))

  // Verify user is member
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url))

  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) return NextResponse.redirect(new URL('/no-access', req.url))

  // Pass tenant context downstream via headers
  const res = NextResponse.next()
  res.headers.set('x-tenant-id', tenant.id)
  res.headers.set('x-tenant-slug', tenantSlug)
  res.headers.set('x-user-role', membership.role)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
```

### A5. Server-side tenant context

Provide a single helper that EVERY server action and route handler must use:

```ts
// lib/tenant.ts
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'

export async function getTenantContext() {
  const h = headers()
  const tenantId = h.get('x-tenant-id')
  const role = h.get('x-user-role')
  if (!tenantId) throw new Error('No tenant context')

  const supabase = createServerClient()
  // Set the request-scoped tenant id so RLS clamps queries
  await supabase.rpc('set_request_tenant', { t: tenantId })
  return { tenantId, role, supabase }
}
```

Plus the SQL side:

```sql
create or replace function set_request_tenant(t uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not user_has_tenant_access(t) then
    raise exception 'Access denied to tenant %', t;
  end if;
  perform set_config('request.tenant_id', t::text, true);
end;
$$;
```

### A6. Service role helpers — danger zone

Service role bypasses RLS. Restrict to:
- Stripe webhook handlers
- Cron jobs (dues generation, reminders)
- Tenant onboarding (creating the first row in a tenant before any membership exists)
- Platform console actions

Wrap in a single `lib/admin.ts` with a logger that records `tenant_id`, `actor`, `action`, `before`, `after` to a `platform_audit_log` table.

### A7. Madison Park backfill migration

```sql
-- 1. Create the tenant
insert into tenants (slug, name, legal_name, type, status)
values ('madison-park', 'Madison Park HOA',
        'Madison Park Property Owners'' Association, Inc.', 'hoa', 'active');

-- 2. Backfill tenant_id on every existing table
do $$
declare
  mp_id uuid;
  t text;
begin
  select id into mp_id from tenants where slug='madison-park';

  for t in
    select unnest(array[
      'properties','residents','violations','letters','vendors','vendor_jobs',
      'announcements','documents','payments','requests','arc_requests',
      'profiles_extra','audit_log','hoa_settings','letter_templates'
    ])
  loop
    execute format('alter table %I add column if not exists tenant_id uuid references tenants', t);
    execute format('update %I set tenant_id = %L where tenant_id is null', t, mp_id);
    execute format('alter table %I alter column tenant_id set not null', t);
    execute format('create index if not exists idx_%s_tenant on %I(tenant_id, created_at desc)', t, t);
  end loop;
end $$;

-- 3. Make Asaf the owner
insert into tenant_memberships (tenant_id, user_id, role, status)
select t.id, u.id, 'owner', 'active'
from tenants t, auth.users u
where t.slug = 'madison-park' and u.email = 'asaf@<his-email-domain>';
```

### A8. Storage isolation

Supabase Storage buckets are global. Use a path convention enforced by storage policy:

```
hoa-assets/{tenant_id}/logo.png
hoa-assets/{tenant_id}/violations/{violation_id}/photo-1.jpg
hoa-assets/{tenant_id}/documents/declaration.pdf
hoa-assets/{tenant_id}/letters/sent/{letter_id}.pdf
```

RLS-style storage policy:

```sql
create policy "tenant_storage_read" on storage.objects for select
using (
  bucket_id = 'hoa-assets'
  and (storage.foldername(name))[1]::uuid in (
    select tenant_id from tenant_memberships
    where user_id = auth.uid() and status = 'active'
  )
);
-- repeat for insert/update/delete
```

### A9. Auth flows

- Sign up creates an `auth.users` row only. Tenant is created in onboarding (Stream C).
- Login lands the user on `/select-tenant` if they have multiple memberships, else direct to `/[slug]`.
- Invitation acceptance: token → join existing tenant.
- Password reset, magic link, OAuth (Google) all go through Supabase Auth.

### A10. Audit log

```sql
create table audit_log (
  id          bigserial primary key,
  tenant_id   uuid not null references tenants,
  actor_id    uuid references auth.users,
  actor_email text,
  action      text not null,        -- 'violation.create', 'letter.send', etc.
  entity      text,                  -- 'violation'
  entity_id   uuid,
  metadata    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz default now()
);
create index on audit_log(tenant_id, created_at desc);
```

A `lib/audit.ts` helper that wraps every server action.

---

## Validation checklist

- [ ] `tenants`, `tenant_memberships`, `tenant_invitations` tables exist
- [ ] All 14 existing tables have `tenant_id not null` and the standard 4 RLS policies
- [ ] `set_request_tenant()` raises on access violation
- [ ] Logging in as Asaf and visiting `/madison-park` shows all original Madison Park data
- [ ] Manually inserting a fake second tenant and querying its data as Asaf returns 0 rows
- [ ] Storage bucket policy blocks cross-tenant reads (verified with two test users)
- [ ] Service role usage audit-logged in `platform_audit_log`
- [ ] Middleware redirects unauthenticated users to `/login?next=...`
- [ ] No `select * from <business_table>` in any server action without going through `getTenantContext`
- [ ] CI grep job fails the build if it finds raw service-role usage outside `lib/admin.ts`

---

## Open questions for Asaf

1. Email domain for tenant invites and platform notices — keep `noreply@madisonparkhoa.com` or move to `noreply@hoahub.app`?
2. Slug strategy for tenants with the same name in different states?
3. Should resident logins live in the same `auth.users` table as admins, or a separate auth scheme?  *(Recommendation: same table, role on membership.)*
