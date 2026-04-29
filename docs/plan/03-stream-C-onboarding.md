# Stream C — Tenant Onboarding Wizard
**Agent:** `onboarding-agent`
**Depends on:** Stream A
**Goal:** A guided multi-step wizard that takes a brand-new community from "I just signed up" to "I'm running operations" in under 30 minutes.

---

## Deliverables

1. `/onboarding` — Wizard shell with progress bar, persistent draft state, resumable
2. 7 steps that can be completed in any order, but unlock sequentially when first done
3. Bulk import for residents/properties (CSV + Excel)
4. AI-assisted governing-document parsing
5. Sample data option (one-click "Try it with demo data first")
6. End-state: redirect to `/[slug]` dashboard with a "Welcome" tour overlay

---

## The 7 steps

### Step 1 — Community profile

Form fields:
- Community name *
- Legal name (the association entity)
- Slug (auto-derived, editable, validated unique)
- Type: HOA / COA / Master / Townhome / Condo / Sub-association
- Founded year
- # of properties (rough)
- Address (street, city, state, zip)
- Time zone (default America/New_York based on state)
- Fiscal year start (default Jan 1)
- Currency (default USD)

On save: creates the `tenants` row, makes the user the owner, sets `status='trial'`, `trial_ends_at = now() + 14 days`.

### Step 2 — Branding

- Logo upload (recommended 512×512 PNG with transparent bg)
- Primary color picker (with palette suggestions)
- Accent color
- Letterhead PDF upload (optional — used for letter generation)
- Preview pane shows mock dashboard, mock letter, mock email with selections applied

Saves to `tenant_settings.branding` jsonb.

### Step 3 — Properties & residents

Three options:

**Option A — Bulk import (CSV/XLSX)**
- Download template button (provides Excel with pre-filled column headers and sample rows)
- Drop file → preview first 20 rows in a table → column mapper (auto-detect addresses, names, emails, phone) → validation report (highlights duplicates, missing emails, invalid zips) → confirm → background import job
- Imports up to 5,000 rows, tracks progress, sends email when done
- Required cols: address. Optional: lot_number, owner_name, owner_email, owner_phone, type, move_in_date

**Option B — Manual entry**
- Add one property at a time (used for small communities or top-ups)

**Option C — Sample data**
- Loads 25 fictional properties + residents so the user can explore the app before committing real data
- Clearly labeled "Demo data — replace before going live"
- One-click "Clear demo data" available later in settings

### Step 4 — Governing documents

User uploads PDFs or Word docs of:
- Declaration / CC&Rs
- Bylaws
- Architectural guidelines
- Rules and regulations
- Articles of incorporation

For each upload:
1. File goes to storage at `hoa-assets/{tenant_id}/governing/{filename}`
2. Backend extracts text via `pdf-parse` (use the pdf skill or pdf-reading skill)
3. Backend calls Claude API with the structured-extraction prompt below to produce a `knowledge_base` jsonb
4. The KB is shown to the user with a section-by-section preview and an "Edit before publishing" option

**Structured-extraction prompt** (paraphrased — full version in `08-stream-H-features.md`):
> Extract this HOA governing document into the canonical schema covering: leasing rules, fines schedule, ARC process, use restrictions, fence/architectural specs, voting thresholds, easements, governance, definitions. Output strict JSON matching `lib/kb-schema.ts`.

The output is stored in `tenant_knowledge_base` with citations back to page numbers / section IDs.

### Step 5 — Letter & email templates

Pre-seeded templates per community type. User reviews and tweaks:
- Welcome letter (new resident)
- Friendly courtesy notice (pre-violation)
- First violation notice
- Second violation notice
- Final notice / fine
- Hearing invitation
- Payment reminder
- Annual meeting notice
- General announcement

Editor: rich-text with merge fields like `{{property.address}}`, `{{resident.full_name}}`, `{{violation.category}}`, `{{board.contact_email}}`.

Each template also has a sender identity (from name + reply-to email).

### Step 6 — Configuration

Tabs:
- **Fines & dues** — fine schedule, dues amount, due cadence, grace period, late fee
- **Violation categories** — pre-seeded, can add/remove (e.g., "Lawn maintenance", "Trash visibility", "Architectural", "Parking", "Pets")
- **Leasing rules** — open/restricted, % cap, minimum term
- **Vendor categories** — landscaping, pool, security, etc.
- **Access control** — who can see what (roles matrix)

### Step 7 — Invite your team

- Add board members and committee members by email + role
- Each gets an invitation email with a one-click join link (uses `tenant_invitations` table from Stream A)
- Optional: bulk-invite all residents to the resident portal (sends a welcome email with magic link)

After Step 7 → "You're ready! Go to dashboard" → redirects to `/[slug]`.

---

## Wizard mechanics

- State persisted to `onboarding_progress` table:
  ```sql
  create table onboarding_progress (
    tenant_id   uuid primary key references tenants,
    step1_done  boolean default false, step1_data jsonb,
    step2_done  boolean default false, step2_data jsonb,
    -- ... through step7
    completed_at timestamptz
  );
  ```
- User can resume any time by visiting `/onboarding`
- A skip button allows finishing now and returning later (we badge their dashboard with "Setup 60% complete" until done)
- All step actions are server actions, idempotent
- Progress bar at top + left sidebar with step list
- After import jobs (Step 3, Step 4) finish, send email + push to dashboard activity feed

---

## CSV/XLSX import details

Use `papaparse` for CSV, `xlsx` (SheetJS) for Excel. Run import in a Supabase Edge Function or a server-side Node route to keep the UI responsive.

Validation pipeline:
1. Schema check (required cols present)
2. Type check (email format, phone format, date format)
3. Dedup against existing properties (by address normalized)
4. Sanity check (no rows with all-empty values, no obviously test data)
5. Generate a validation report with row-level errors and warnings
6. User clicks "Import valid rows" or "Fix errors and re-upload"

---

## AI-assisted governing-doc parsing — accuracy guardrails

- Show the user the extracted structure with the source PDF side-by-side
- Highlight which sections were extracted with high confidence vs. low
- Allow inline edits before saving to KB
- Store both the raw extraction AND the user's edits, so we can improve the prompt later
- Never publish to the live KB without an explicit "Approve & publish" click

---

## Validation checklist

- [ ] New user can complete all 7 steps in < 30 min using sample data
- [ ] CSV import handles 1,000-row file in < 60 sec
- [ ] Drafts persist if the user closes the browser mid-step
- [ ] Branding selections appear in Step 7's invitation email preview
- [ ] AI extraction produces valid JSON conforming to `kb-schema.ts` for the Madison Park CC&Rs
- [ ] Dashboard shows "Setup X% complete" until step 7 done
- [ ] Re-running an import doesn't create duplicates (idempotent on address)
- [ ] Trial countdown banner appears at top of dashboard once setup is complete

---

## Open questions for Asaf

1. Should sample/demo data be a separate sandbox tenant, or just rows in the user's real tenant marked as `is_demo=true`? *(Recommendation: separate sandbox tenant, so cleanup is one delete.)*
2. Default fine schedule values for the new template (used as defaults until user overrides)?
3. Do we want a concierge "we'll set this up for you" upsell at Step 3? (Pricing: $499 one-time?)
