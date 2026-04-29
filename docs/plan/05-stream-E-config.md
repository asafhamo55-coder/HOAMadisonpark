# Stream E — Tenant Configuration, Branding & Knowledge Base
**Agent:** `config-agent`
**Depends on:** Stream A
**Goal:** Everything that varies between communities is data the tenant can edit themselves. No code changes per community.

---

## Deliverables

1. `tenant_settings` schema with namespaced configuration buckets
2. Settings UI under `/[slug]/settings/*` with tabs
3. Branding (logo, colors, letterhead, email sender) applied app-wide
4. Per-tenant knowledge base (governing documents, structured)
5. Per-tenant rule engine (fines, dues cadence, leasing rules, violation categories)
6. Per-tenant letter & email templates
7. Live preview for branding changes

---

## Schema

```sql
create table tenant_settings (
  tenant_id   uuid primary key references tenants on delete cascade,
  branding    jsonb default '{}',
  identity    jsonb default '{}',         -- legal name, address, contact, fiscal year
  finance     jsonb default '{}',         -- dues, late fees, fine schedule
  rules       jsonb default '{}',         -- leasing cap %, parking, pets, etc.
  categories  jsonb default '{}',         -- violation categories, request categories, vendor categories
  features    jsonb default '{}',         -- feature toggles (per plan + tenant overrides)
  email       jsonb default '{}',         -- from name, reply-to, signature footer
  notifications jsonb default '{}',       -- which events trigger emails / pushes
  updated_at  timestamptz default now(),
  updated_by  uuid references auth.users
);

create table tenant_knowledge_base (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants on delete cascade,
  document_id   uuid references documents,        -- which uploaded doc this came from
  section_path  text,                              -- e.g., 'leasing.restrictions'
  title         text,
  content       text,                              -- the human-readable rule
  structured    jsonb,                             -- machine-readable form
  citations     jsonb,                             -- page #, section ID, exhibit
  embedding     vector(1536),                      -- pgvector for semantic search
  is_published  boolean default false,
  version       int default 1,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on tenant_knowledge_base(tenant_id, section_path);
create index on tenant_knowledge_base using ivfflat (embedding vector_cosine_ops);

create table letter_templates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants on delete cascade,
  key           text not null,                     -- 'courtesy_notice', 'first_violation', etc.
  name          text,
  subject       text,
  body_html     text,
  body_pdf      text,
  variables     jsonb,                              -- list of merge fields used
  is_default    boolean default false,
  is_system     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (tenant_id, key)
);

create table violation_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants on delete cascade,
  name        text not null,
  description text,
  default_fine_cents int,
  warning_letter_template uuid references letter_templates,
  notice_letter_template  uuid references letter_templates,
  fine_letter_template    uuid references letter_templates,
  active      boolean default true,
  sort_order  int
);
```

Apply standard tenant RLS to all of these.

---

## Settings UI structure

`/[slug]/settings/`

- **General** — community name, type, address, fiscal year, time zone, contact info
- **Branding** — logo, primary/accent colors, letterhead, login screen image
- **Email** — from name, reply-to, footer, signature, test-send button
- **Finance** — dues amount, dues cadence, due dates, late fee, grace period
- **Fine schedule** — table of categories → 1st / 2nd / 3rd offense amounts
- **Violation categories** — CRUD list, drag-to-reorder
- **Letter templates** — list with editor (rich-text + merge field inserter + preview)
- **Rules & restrictions** — leasing cap %, lease minimum term, parking rules, pet rules (these become rule cards in the resident portal)
- **Knowledge base** — list of structured rules with edit/republish
- **Members & roles** — invite, list, change role, remove
- **Integrations** — Stripe (billing), Google Workspace, QuickBooks (Pro+)
- **Billing** — links to Stream D
- **Audit log** — searchable, exportable (Standard+)
- **Danger zone** — export all data (CSV/JSON), transfer ownership, cancel subscription

---

## Branding propagation

Branding tokens are applied in three places:

1. **In-app UI** — CSS variables set at the root of the tenant layout from `tenant_settings.branding`
2. **Emails** — every transactional email reads tenant branding from the DB at send time and injects logo + colors
3. **Letters** — PDF generator (use the pdf skill) uses the letterhead PNG and brand colors for headers/footers

```ts
// app/[slug]/layout.tsx (excerpt)
const settings = await getTenantSettings(tenantId)
const css = `
  :root {
    --tenant-primary: ${settings.branding.primary ?? '#0F2A47'};
    --tenant-accent:  ${settings.branding.accent  ?? '#10B981'};
  }
`
return (
  <>
    <style dangerouslySetInnerHTML={{ __html: css }} />
    {children}
  </>
)
```

---

## Knowledge base: structure

We standardize on a JSON schema that every community's KB conforms to. Madison Park's is already partially structured (from prior work) — use it as the canonical example.

Top-level sections:

```ts
type KBSchema = {
  identity: { name; legal_name; recorded_date; jurisdiction }
  governance: { board_size; quorum; voting_thresholds; election_cycle }
  assessments: { dues_amount; cadence; late_fee; lien_threshold }
  fines: { schedule: { category; first; repeat; max }[] }
  violations: { category; description; remedy; references }[]
  architectural: { arc_required_changes; review_window_days; appeal_process }
  fences: { allowed_materials; height; setback; color }
  leasing: { open_or_restricted; cap_pct; min_term_months; lease_form_required }
  uses: { prohibited; permitted_with_approval; signage; pets; vehicles; pools }
  insurance: { association_obligations; owner_obligations }
  easements: { types[] }
  amendments: { thresholds; voting_class }
  definitions: { term; definition }[]
}
```

The KB is queryable two ways:
- **Direct lookup** — "what is the leasing cap %?" → `kb.leasing.cap_pct`
- **Semantic search** — embeds questions and finds the most relevant chunks (pgvector cosine similarity), then a Claude call answers with citations

---

## Letter template editor

- TipTap-based rich text editor (lib already in shadcn ecosystem)
- Sidebar: list of available merge fields for the current template type
- Merge fields styled as chips inside the editor (e.g., `{{property.address}}`)
- "Insert image" / "Insert page break" / "Insert signature block" buttons
- Live preview shows rendered output with sample data
- Version history (every save creates a `letter_template_versions` row)
- "Reset to default" restores the system template

System templates ship with the app and are cloned per tenant on creation.

---

## Validation checklist

- [ ] Changing primary color in Branding immediately re-themes the dashboard on next page load
- [ ] Sending a test email from Email settings produces an email with tenant logo and colors
- [ ] Creating a new violation category appears in the violations module
- [ ] Editing a letter template creates a new version row
- [ ] Knowledge base can be queried by section path AND by semantic search
- [ ] Madison Park KB is fully populated post-migration (verified by querying `kb.leasing.cap_pct = 15`)
- [ ] All settings tabs respect role-based access (residents cannot view billing, audit log, members)
- [ ] Audit log captures every settings change with diff

---

## Open questions for Asaf

1. Should letter templates support conditional logic (e.g., "if violation.category == 'lawn' then include section X")? Adds complexity but is powerful. *(Recommendation: defer to Phase 2.)*
2. White-label level — keep "Powered by HOA Hub" footer on Starter/Standard? Remove for Pro+? Or always remove?
3. Time zone — store at tenant level only, or also at user level?
