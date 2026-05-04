# Madison Park → Stoop: Multi-Tenancy Migration Plan

**Status:** Plan, not yet executed.
**Goal:** Convert the single-tenant Madison Park codebase into multi-tenant SaaS without data loss for Madison Park.
**Companion:** [`PROJECT_FOUNDATION.md`](./PROJECT_FOUNDATION.md)
**Estimated effort:** ~8 working days.

---

## 1. Invariants

These must hold throughout and after migration:

1. **No data loss for Madison Park.** Every existing row in `properties`, `residents`, `violations`, `letters`, `vendors`, `vendor_jobs`, `announcements`, `documents`, `payments`, `email_templates`, `notifications`, `requests`, `audit_log`, `hoa_settings` survives.
2. **No cross-tenant data leakage.** RLS prevents tenant A from reading tenant B even if app code has bugs.
3. **Storage isolation.** Files in `violations`, `documents`, `logos` buckets are scoped by `org_id` in their path.
4. **Auth keeps working.** Existing Madison Park admin/resident logins continue to work — same email/password, no re-onboarding.
5. **Realtime keeps working.** Notification subscriptions filter by `org_id`.

---

## 2. Schema changes — `008_multi_tenancy.sql`

### New table: `organizations`

```sql
create table organizations (
  id                    uuid default gen_random_uuid() primary key,
  slug                  text not null unique,
  name                  text not null,
  size_tier             text check (size_tier in ('small','medium','large')),
  city                  text,
  state                 text,
  zip                   text,
  logo_url              text,
  primary_color         text,
  board_president_name  text,
  from_email            text,
  created_at            timestamptz default now()
);
alter table organizations enable row level security;
```

### Add `org_id` to every domain table

```sql
alter table profiles        add column org_id uuid references organizations;
alter table properties      add column org_id uuid references organizations;
alter table residents       add column org_id uuid references organizations;
alter table violations      add column org_id uuid references organizations;
alter table letters         add column org_id uuid references organizations;
alter table vendors         add column org_id uuid references organizations;
alter table vendor_jobs     add column org_id uuid references organizations;
alter table announcements   add column org_id uuid references organizations;
alter table documents       add column org_id uuid references organizations;
alter table payments        add column org_id uuid references organizations;
alter table email_templates add column org_id uuid references organizations;
alter table requests        add column org_id uuid references organizations;
alter table notifications   add column org_id uuid references organizations;
alter table audit_log       add column org_id uuid references organizations;
alter table hoa_settings    add column org_id uuid references organizations;
```

### Create Madison Park org and backfill

Run inside a single transaction. If any update fails, rollback.

```sql
begin;

insert into organizations (slug, name, city, state, zip, size_tier)
values ('madison-park', 'Madison Park HOA', 'Johns Creek', 'GA', '30022', 'medium')
returning id;
-- capture as :mp_org_id

update profiles        set org_id = :mp_org_id where org_id is null;
update properties      set org_id = :mp_org_id where org_id is null;
update residents       set org_id = :mp_org_id where org_id is null;
update violations      set org_id = :mp_org_id where org_id is null;
update letters         set org_id = :mp_org_id where org_id is null;
update vendors         set org_id = :mp_org_id where org_id is null;
update vendor_jobs     set org_id = :mp_org_id where org_id is null;
update announcements   set org_id = :mp_org_id where org_id is null;
update documents       set org_id = :mp_org_id where org_id is null;
update payments        set org_id = :mp_org_id where org_id is null;
update email_templates set org_id = :mp_org_id where org_id is null;
update requests        set org_id = :mp_org_id where org_id is null;
update notifications   set org_id = :mp_org_id where org_id is null;
update audit_log       set org_id = :mp_org_id where org_id is null;
update hoa_settings    set org_id = :mp_org_id where org_id is null;

commit;
```

### Make `org_id` NOT NULL after backfill

```sql
alter table profiles        alter column org_id set not null;
alter table properties      alter column org_id set not null;
alter table residents       alter column org_id set not null;
alter table violations      alter column org_id set not null;
alter table letters         alter column org_id set not null;
alter table vendors         alter column org_id set not null;
alter table vendor_jobs     alter column org_id set not null;
alter table announcements   alter column org_id set not null;
alter table documents       alter column org_id set not null;
alter table payments        alter column org_id set not null;
alter table email_templates alter column org_id set not null;
alter table requests        alter column org_id set not null;
alter table notifications   alter column org_id set not null;
alter table audit_log       alter column org_id set not null;
alter table hoa_settings    alter column org_id set not null;
```

### Indexes

```sql
create index idx_properties_org      on properties      (org_id);
create index idx_residents_org       on residents       (org_id);
create index idx_violations_org      on violations      (org_id);
create index idx_letters_org         on letters         (org_id);
create index idx_vendors_org         on vendors         (org_id);
create index idx_vendor_jobs_org     on vendor_jobs     (org_id);
create index idx_announcements_org   on announcements   (org_id);
create index idx_documents_org       on documents       (org_id);
create index idx_payments_org        on payments        (org_id);
create index idx_email_templates_org on email_templates (org_id);
create index idx_requests_org        on requests        (org_id);
create index idx_notifications_org   on notifications   (org_id);
create index idx_audit_log_org       on audit_log       (org_id);
create index idx_hoa_settings_org    on hoa_settings    (org_id);

-- Composite indexes for common query patterns
create index idx_violations_org_status     on violations (org_id, status);
create index idx_payments_org_status       on payments   (org_id, status);
create index idx_letters_org_violation     on letters    (org_id, violation_id);
create index idx_announcements_org_pub     on announcements (org_id, published_at);
```

---

## 3. RLS rewrite — `009_rls_org_scoping.sql`

### Helper function

```sql
create or replace function public.current_org_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;
```

### Drop and recreate every existing policy

For each domain table, every existing policy is dropped and rewritten with `org_id` as a leading predicate. Pattern:

```sql
-- Properties: admin/board full access (within org)
drop policy "properties_admin_board_all" on properties;
create policy "properties_admin_board_all"
  on properties for all
  using  (org_id = public.current_org_id() and public.get_user_role() in ('admin','board'))
  with check (org_id = public.current_org_id() and public.get_user_role() in ('admin','board'));

-- Properties: residents read only their property within their org
drop policy "properties_resident_read" on properties;
create policy "properties_resident_read"
  on properties for select
  using (
    org_id = public.current_org_id()
    and public.get_user_role() = 'resident'
    and id in (
      select property_id from residents
      where profile_id = auth.uid() and is_current = true
    )
  );
```

Apply the same pattern to: `residents`, `violations`, `letters`, `vendors`, `vendor_jobs`, `announcements`, `documents`, `payments`, `email_templates`, `requests`, `notifications`, `audit_log`, `hoa_settings`.

### Policies on `organizations` itself

```sql
create policy "organizations_self_read"
  on organizations for select
  using (id = public.current_org_id());

create policy "organizations_self_update"
  on organizations for update
  using  (id = public.current_org_id() and public.get_user_role() = 'admin')
  with check (id = public.current_org_id() and public.get_user_role() = 'admin');

-- INSERT is performed by the onboarding API route using a service-role client,
-- not by user-context queries. No insert policy needed.
```

---

## 4. Storage path migration

### Today
```
violations/{violation_id}/photo.jpg
documents/{file_name}
logos/{file_name}
```

### After
```
violations/{org_id}/{violation_id}/photo.jpg
documents/{org_id}/{file_name}
logos/{org_id}/{file_name}
```

### Migration script (Node/TS, run once)

`scripts/migrate-storage-paths.ts`:
1. List all objects in each bucket.
2. For each object, copy to `{MP_ORG_ID}/{old_path}` then delete the original.
3. Update `documents.file_url` and `violations.photos[]` to the new paths.

### New storage policies

```sql
-- Storage RLS lives in the storage.objects table. Rough shape:
create policy "storage_org_scoped_read"
  on storage.objects for select
  using (
    bucket_id in ('violations','documents','logos')
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
```

(Apply equivalents for insert/update/delete with role gating.)

---

## 5. Application code changes

### Server-side helper

Add to `src/lib/supabase/server.ts`:

```ts
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();
  return profile?.org_id ?? null;
}
```

### Insert audit

App code does **not** need `.eq('org_id', orgId)` on every read — RLS handles it. But every **insert** into a domain table must set `org_id`:

```ts
// Before
await supabase.from('violations').insert({ property_id, category, description });

// After
const orgId = await getCurrentOrgId();
await supabase.from('violations').insert({ org_id: orgId, property_id, category, description });
```

Audit pass: grep `.insert(` across `src/app/actions/` and `src/app/api/`, add `org_id` to every domain-table insert.

### New: onboarding flow

```
src/app/onboarding/create-org/page.tsx     -- form
src/app/api/orgs/create/route.ts           -- service-role insert
```

The API route uses an admin client (`src/lib/supabase/admin.ts`) because the user has no `org_id` until the row exists, so user-context RLS would block.

```ts
// src/app/api/orgs/create/route.ts (sketch)
export async function POST(req: Request) {
  const { name, slug, city, state, zip, sizeTier } = await req.json();
  const admin = createAdminClient();
  const user = await getAuthedUser(req);

  const { data: org } = await admin
    .from('organizations')
    .insert({ name, slug, city, state, zip, size_tier: sizeTier })
    .select()
    .single();

  await admin
    .from('profiles')
    .update({ org_id: org.id, role: 'admin' })
    .eq('id', user.id);

  await seedOrgDefaults(admin, org.id); // email templates, violation categories, hoa_settings
  return Response.json({ org });
}
```

### Settings — replace env vars

Today: HOA name, logo, from-email, board-president-name come from `process.env` and `NEXT_PUBLIC_*`. After: read from the user's `organizations` row in `src/app/(dashboard)/dashboard/settings/page.tsx`. Env vars become *defaults for new orgs only*.

### Email templates — per-org

Default templates seeded per-org on creation. Per-org overrides live in `email_templates` rows with `org_id` set. The template lookup in `src/lib/email/templates.ts` becomes:

```ts
const { data } = await supabase
  .from('email_templates')
  .select('*')
  .eq('name', templateName)
  .single(); // RLS already filters to current org
```

### Routing

Phase 1 (this migration): no routing changes — all URLs continue to work because every authed user has exactly one `org_id` and queries are auto-scoped via RLS.

Phase 2 (post-migration, before tenant #2): introduce `/o/{org-slug}/...` prefix and a redirect from legacy paths for Madison Park users.

---

## 6. Execution plan

### Pre-migration
1. Full DB dump: `supabase db dump -f pre-migration-backup.sql`.
2. Storage backup: sync all buckets locally.
3. Branch off main: `claude/multi-tenancy-migration` (separate from `claude/create-project-foundation-fAHmG`).

### Migration sequence
1. Apply `008_multi_tenancy.sql` (schema + backfill + indexes).
2. Apply `009_rls_org_scoping.sql` (RLS rewrite).
3. Run `scripts/migrate-storage-paths.ts`.
4. Update application code (insert audit, onboarding flow, settings page, email-template lookup).
5. Local test on a fresh Supabase: Madison Park admin login, resident login, violation create + email send + payment view.
6. Deploy to Vercel preview, point at Supabase staging copy of production.
7. Smoke test against preview.
8. Cut-over: apply migrations to production, deploy code.

### Rollback
- Code rollback: revert deploy.
- Schema rollback: `009_rollback.sql` drops `org_id` columns, restores original RLS. **Safe only before any tenant-2 row is written.** After tenant 2 onboards, rollback is one-way; restore from backup instead.

### Madison Park user impact
- Logins unchanged; `profiles.org_id` is set during backfill, no password change.
- URL changes deferred to phase 2.

---

## 7. Out of scope for this migration

So we don't scope-creep:

- Tenant-2 onboarding UX polish (separate workstream)
- Subdomain routing (path-based first, this comes later)
- Stripe billing integration (separate workstream)
- Eviction module
- SMS / Twilio
- Property-management tier admin view

---

## 8. Effort estimate

| Phase | Days |
|---|---|
| Schema + backfill + indexes | 1 |
| RLS rewrite | 1 |
| Storage path migration | 0.5 |
| App code changes (insert audit, onboarding, settings, templates) | 3 |
| Testing + bugfixing | 2 |
| Deploy + cut-over | 0.5 |
| **Total** | **~8 working days** |

Fits in Month 1 of the 3-month plan with margin.
