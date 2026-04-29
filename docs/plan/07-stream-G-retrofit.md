# Stream G — Existing Module Retrofit (Multi-Tenant Migration)
**Agent:** `migration-agent`
**Depends on:** Stream A
**Goal:** Take every existing Madison Park module and make it multi-tenant safe — without changing UX for Madison Park.

---

## Modules to retrofit

The current Madison Park app has these modules. Each needs:
1. `tenant_id` on every table (done in Stream A)
2. RLS policies (done in Stream A)
3. Server actions updated to use `getTenantContext()`
4. Routes moved from `/<module>` to `/[slug]/<module>`
5. UI adapted to read tenant branding/config from `tenant_settings`

| Module | Current path | New path | Notes |
|---|---|---|---|
| Dashboard | `/` | `/[slug]` | Reads from tenant scope |
| Properties | `/properties` | `/[slug]/properties` | Property card preserved |
| Residents | `/residents` | `/[slug]/residents` | Multi-resident-per-property preserved |
| Violations | `/violations` | `/[slug]/violations` | Categories from tenant_settings |
| Letters | `/letters` | `/[slug]/letters` | Templates from `letter_templates` |
| Vendors | `/vendors` | `/[slug]/vendors` | Vendor records per tenant |
| Vendor jobs | `/vendor-jobs` | `/[slug]/vendor-jobs` | |
| Announcements | `/announcements` | `/[slug]/announcements` | |
| Documents | `/documents` | `/[slug]/documents` | Storage path includes tenant_id |
| Payments | `/payments` | `/[slug]/payments` | Dues from tenant_settings |
| ARC requests | `/arc` | `/[slug]/arc` | |
| Resident requests | `/requests` | `/[slug]/requests` | |
| Resident portal | `/portal` | `/[slug]/portal` | Filters by resident's property |
| Settings | `/settings` | `/[slug]/settings` | Plus new tabs from Stream E |

---

## Migration steps per module

For each module, do the following in order:

### 1. Routing rename

```bash
# Move from /app/(dashboard)/<module> to /app/[slug]/(dashboard)/<module>
git mv app/\(dashboard\)/properties app/\[slug\]/\(dashboard\)/properties
```

Update every internal link in the codebase (`<Link href="/properties">` → `<Link href={\`/${tenantSlug}/properties\`}>`).

Provide a `useTenantSlug()` hook that reads from a tenant context provider so links don't have to import the slug everywhere.

### 2. Server actions wrapped

Every action in `app/actions/<module>.ts` must start with:

```ts
'use server'
import { getTenantContext } from '@/lib/tenant'

export async function createViolation(input: CreateViolationInput) {
  const { tenantId, supabase, role } = await getTenantContext()
  if (!['owner','admin','board'].includes(role)) throw new Error('Forbidden')

  // Now any insert needs tenant_id
  const { data, error } = await supabase
    .from('violations')
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single()
  if (error) throw error

  await audit.log({ tenantId, action: 'violation.create', entityId: data.id })
  return data
}
```

Helper: a code-mod script that walks `app/actions/*.ts` and inserts `getTenantContext()` + audit log scaffolding to bootstrap.

### 3. Page-level data fetching

```ts
// app/[slug]/(dashboard)/properties/page.tsx
export default async function PropertiesPage() {
  const { supabase } = await getTenantContext()  // RLS clamps automatically
  const { data: properties } = await supabase
    .from('properties')
    .select('*, residents(*)')
    .order('address')
  return <PropertiesTable properties={properties ?? []} />
}
```

No explicit `.eq('tenant_id', ...)` needed because RLS handles it — but defense in depth recommends adding it anyway in critical queries.

### 4. Storage paths

Wherever the app uploads to Supabase Storage, prepend `tenant_id`:

```ts
const path = `${tenantId}/violations/${violationId}/${file.name}`
await supabase.storage.from('hoa-assets').upload(path, file)
```

Update the public URL helper to handle the new path format.

### 5. Email rendering reads tenant branding

The existing email templates use a hardcoded HOA name and logo. Refactor:

```tsx
// emails/violation-notice.tsx
export function ViolationNotice({ tenant, violation, resident }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif' }}>
        <Container>
          <Img src={tenant.branding.logo_url} width="120" />
          <Heading style={{ color: tenant.branding.primary }}>
            {tenant.name}
          </Heading>
          {/* … rest of template … */}
          <Text>{tenant.email.signature_html}</Text>
        </Container>
      </Body>
    </Html>
  )
}
```

Every email send must look up tenant settings first.

### 6. PDF letter generation reads tenant branding

Same idea for letters generated server-side. Use the pdf skill / docx skill conventions:
- Letterhead PNG from `tenant_settings.branding.letterhead_url`
- Body text injected via React Email or docx-js
- Footer with tenant name + reply-to email

### 7. Resident portal scope

Resident portal already filters by the logged-in user's `resident_id`. Wrap with tenant context:

```ts
// in /app/[slug]/portal/page.tsx
const { tenantId, supabase } = await getTenantContext()
const { data: { user } } = await supabase.auth.getUser()
const { data: membership } = await supabase
  .from('tenant_memberships')
  .select('resident_id, role')
  .eq('tenant_id', tenantId)
  .eq('user_id', user.id)
  .single()
if (membership.role !== 'resident') redirect(`/${slug}`)
const myResidentId = membership.resident_id
```

---

## Per-module retrofit checklists (abbreviated)

### Properties
- [ ] All routes under `/[slug]/properties`
- [ ] Property card shows tenant branding
- [ ] Address normalization preserved
- [ ] Multi-resident logic preserved (active + history)
- [ ] Bulk import respects property cap from billing

### Residents
- [ ] CRUD via `getTenantContext`
- [ ] Vehicle / pet arrays preserved
- [ ] Move-out keeps history
- [ ] Resident → portal user invite flow works

### Violations
- [ ] Categories pulled from `violation_categories` table
- [ ] Photos stored at `{tenant_id}/violations/{id}/...`
- [ ] Status timeline preserved
- [ ] AI summary feature (existing) re-enabled per-tenant

### Letters
- [ ] Templates pulled from `letter_templates` filtered by `tenant_id`
- [ ] Send action increments `usage_events` (`email_sent`)
- [ ] Cap enforcement before send
- [ ] PDF generation uses tenant branding
- [ ] Letter sent log retains for 7 years (compliance)

### Vendors / Vendor jobs
- [ ] Vendor records scoped to tenant
- [ ] Vendor accounts can be invited as `role='vendor'` membership
- [ ] Vendor portal at `/[slug]/portal/vendor` shows only their assigned jobs

### Announcements
- [ ] Tenant-scoped
- [ ] Publishing optionally fanned out via email to all `is_current=true` residents
- [ ] Email send goes through cap check

### Documents
- [ ] Storage path scoped
- [ ] Public vs. board-only ACL
- [ ] Search across tenant docs only

### Payments / Dues
- [ ] Dues amount, cadence, late fee from `tenant_settings.finance`
- [ ] Generate dues batches scoped to tenant
- [ ] Payment ledger scoped
- [ ] Payment reminders use tenant templates

### ARC requests / Maintenance requests
- [ ] Submitted by residents, visible to board
- [ ] Status workflow: submitted → in review → approved/denied → closed
- [ ] Notifications routed via tenant email config

### Settings
- [ ] All existing settings migrated into the new tabbed structure (Stream E)
- [ ] No more global "HOA settings" — all are tenant-scoped

---

## Migration QA strategy

1. **Pre-migration snapshot** — `pg_dump` the current database, plus a CSV export of every table for diffing
2. **Branch migration** — Run the migration on a Supabase preview branch, log row counts before/after
3. **Smoke test** — Asaf logs in to `/madison-park`, walks through every module, confirms data parity
4. **A/B comparison** — Old route (still served from a freezeframe deploy) vs. new route — visual diff of dashboards
5. **Cutover plan** — DNS / route swap during a low-traffic window with a rollback ready
6. **Post-migration** — 1-week canary period where both deployments run, route 5%/25%/50%/100% to new

---

## Validation checklist (overall)

- [ ] All 14 existing routes work under `/madison-park/...`
- [ ] No hardcoded "Madison Park" string left in source code (replaced by tenant lookup)
- [ ] No hardcoded `from('properties').select` without `getTenantContext` first
- [ ] CI grep job fails build if it finds either of the above
- [ ] Lighthouse identical or better post-migration
- [ ] All unit tests pass (and new tests for tenant isolation added)
- [ ] Verified that creating tenant `test-hoa` and inserting data does NOT show up under `/madison-park`
- [ ] Verified the inverse: Madison Park data does NOT show up under `/test-hoa`

---

## Open questions for Asaf

1. Tenant slug for Madison Park — `madison-park` or `madisonpark` or `mp`? *(Recommend `madison-park` — readable, web-friendly.)*
2. Cutover window — overnight Saturday? Hold off until pilot 2 signs up?
3. Data retention on cancelled tenants — 30 days, then anonymize residents but keep aggregates? Need a written policy before launch.
