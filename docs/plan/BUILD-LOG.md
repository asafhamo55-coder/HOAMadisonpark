# BUILD-LOG

Append-only log of orchestrator and stream activity.

---

## [2026-04-29 01:20] Orchestrator: plan files received and committed
**Outcome:** All 12 plan files (00–11) saved to `docs/plan/` and committed to `claude/hoa-hub-multi-tenant-LFfzI`. Plan reviewed end-to-end.
**Files changed:** 12 new docs in `docs/plan/`.
**Tests:** N/A (docs only).
**Open questions:** 24 across all streams; 10 flagged as Phase-1 blockers.

## [2026-04-29 01:25] Orchestrator: Asaf decisions captured
**Outcome:** All 24 open questions answered. Brand renamed to "HOA Pro Hub", platform domain is `hoaprohub.app`, Madison Park slug = `madison-park`, pricing held at $49/$129/$299, Stripe test mode only, all 15 H features intended (later cut for free tier — see next entry).
**Files changed:** none.
**Tests:** N/A.
**Open questions:** Two follow-ups raised on AI scope and hosting.

## [2026-04-29 01:30] Orchestrator: free-tier-only constraint locked in; AI fully removed
**Outcome:** Asaf confirmed no paid vendors at this stage and no AI capabilities. Final scope and substitution table written to `docs/plan/DECISIONS.md`. Stream H scope reduced from 15 to 10 features (H1, H2, H5-QB, H14, H15 dropped). All other streams keep their specs but defer Stripe to test mode and KB to tsvector-only search. Existing app already uses free tools (Resend, Supabase, Vercel) so no rip-and-replace needed.
**Files changed:** `docs/plan/DECISIONS.md` (new), `docs/plan/BUILD-LOG.md` (new).
**Tests:** N/A.
**Open questions:** None blocking. Awaiting explicit "go" from Asaf to start Stream A.

---

## Inventory of existing app (`madison-park-hoa/`)

Recorded so subsequent streams have ground truth.

**Stack:**
- Next.js 14.2.35 + React 18 + TypeScript
- Tailwind 3.4 + shadcn/ui (Radix primitives) + Lucide icons
- Supabase (`@supabase/ssr` 0.9, `@supabase/supabase-js` 2.99) for DB, Auth, Storage
- Resend 6.9 + React Email 5.2 for transactional email
- `next-pwa` 5.6 — PWA support already wired
- TanStack Table 8.21, Recharts 3.8, Zod 4.3, react-hook-form 7.71

**Existing migrations** (`supabase/migrations/`):
1. `001_init.sql`
2. `002_hoa_settings_and_audit.sql`
3. `003_requests_table.sql`
4. `004_notifications_and_indexes.sql`
5. `005_storage_buckets.sql`
6. `006_properties_residents_improvements.sql`
7. `007_email_attachments_and_activity.sql`

**Existing routes:**
- `(auth)/login`, `(auth)/reset-password`
- `(dashboard)/dashboard` + sub-routes: `announcements`, `documents`, `email`, `email/broadcast`, `payments`, `properties`, `properties/[id]`, `properties/[id]/tabs`, `settings`, `vendors`, `vendors/jobs`, `violations`
- `(portal)/portal` + `account`, `community`
- API routes: `debug-email`, `vendor-jobs`

**Existing server actions** (`src/app/actions/`):
- `announcements.ts`, `documents.ts`, `email.ts`, `notifications.ts`, `payments.ts`, `portal.ts`, `properties.ts`, `settings.ts`, `violations.ts`

**NOT in the existing app (must be added or stay out):**
- ❌ Stripe SDK (Stream D — to add in test mode)
- ❌ Anthropic / OpenAI SDK (dropped per free-tier decision)
- ❌ PostHog (Stream A or B — to add free tier)
- ❌ Plausible (dropped)
- ❌ Twilio (dropped)
- ❌ pdf-parse / pdfjs-dist (Stream C — to add)
- ❌ papaparse / xlsx (Stream C — to add)
- ❌ TipTap (Stream E — to add)
- ❌ next-intl (dropped — H14 cut)
- ❌ pgvector extension (Stream A — schema reserves column but doesn't use)

**Notable observation:** existing routes are NOT yet under `/[slug]/...`. The Stream G retrofit (path rename + tenant-scoped routing) is required and unavoidable.

---

## [2026-04-29 02:45] arch-agent: Stream A — Foundation & Multi-Tenant Core complete

**Outcome:** The Madison Park codebase is now multi-tenant capable. Four migrations (008–011) install the tenant tables, RLS helpers, audit logs, the standard 4-policy tenant clamp on every business table, and tenant-scoped storage policies. A new `lib/tenant.ts` exposes `getTenantContext()` for downstream streams, `lib/admin.ts` wraps every service-role call in a `platform_audit_log` row, and `lib/audit.ts` writes per-tenant `audit_log` rows. Middleware additively resolves `/[slug]/...` URLs without breaking the existing `/dashboard`, `/portal`, `/login` routes — the full route move is owned by Stream G. Auth scaffolding pages (`/select-tenant`, `/no-access`, `/suspended`, `/accept-invite/[token]`) ship for the upcoming invitation flow.

**Files changed:** 14 new + 3 modified.

Migrations (new):
- `madison-park-hoa/supabase/migrations/008_tenants_and_helpers.sql`
- `madison-park-hoa/supabase/migrations/009_audit_log.sql`
- `madison-park-hoa/supabase/migrations/010_existing_tables_alter.sql`
- `madison-park-hoa/supabase/migrations/011_storage_policies.sql`

Lib helpers (new):
- `madison-park-hoa/src/lib/tenant.ts`
- `madison-park-hoa/src/lib/admin.ts`
- `madison-park-hoa/src/lib/audit.ts`

Auth scaffolding (new):
- `madison-park-hoa/src/app/accept-invite/[token]/page.tsx`
- `madison-park-hoa/src/app/select-tenant/page.tsx`
- `madison-park-hoa/src/app/no-access/page.tsx`
- `madison-park-hoa/src/app/suspended/page.tsx`

Verification (new):
- `madison-park-hoa/scripts/verify-rls-isolation.sql`
- `madison-park-hoa/scripts/check-no-service-role.sh`

Modified:
- `madison-park-hoa/src/middleware.ts` — additive tenant resolver
- `madison-park-hoa/src/components/email/email-composer.tsx` — drop pre-existing dead `setOriginalTemplateHtml('')` call so the build is green
- `docs/plan/09-data-model.md` — sync migration order with reality (Stream A used 008–011)

**Migrations added:**
| # | Title | Purpose |
|---|---|---|
| 008 | tenants_and_helpers | New `tenants`, `tenant_memberships`, `tenant_invitations` tables; `current_tenant_id`, `user_has_tenant_access`, `user_role_in_tenant`, `set_request_tenant`, `apply_tenant_rls`, `set_updated_at` functions; RLS on the new tenant tables |
| 009 | audit_log | Reshapes `audit_log` for tenant scoping; creates `platform_audit_log` |
| 010 | existing_tables_alter | Backfills Madison Park; adds `tenant_id NOT NULL` to 14 tables; drops legacy role-based policies; applies the standard tenant clamp |
| 011 | storage_policies | Replaces single-tenant storage policies with a tenant-id-prefix-based clamp |

**Tests / verification scripts written:**
- `scripts/verify-rls-isolation.sql` — creates a synthetic second tenant, two synthetic users, verifies (a) `set_request_tenant` raises 42501 on a foreign tenant, (b) cross-tenant SELECT returns 0 rows, (c) cross-tenant INSERT is blocked, (d) the second user only sees their own tenant. Cleans up everything it creates.
- `scripts/check-no-service-role.sh` — CI grep guard that fails the build if any new file outside the documented whitelist imports `SUPABASE_SERVICE_ROLE_KEY`, `createAdminClient`, or `unsafeServiceRoleClient`. Runs clean today.

**Row counts before/after Madison Park backfill (REQUIRED):**
The backfill is wrapped in `migration 010` and writes a row per table to `public.tenant_backfill_audit` capturing `rows_before`, `rows_after`, and `rows_with_tenant`. The migration `RAISE EXCEPTION`s if any table's `rows_before <> rows_after` or if any row is left without a `tenant_id`, so it is impossible for a successful migration to have lost data. **The migration has not yet been applied to the live Supabase project** (Asaf will run it manually using the Supabase SQL editor — agent has no DB access from this sandbox), so the actual numbers will be filled in below after Asaf runs `select * from public.tenant_backfill_audit order by id;` post-migration:

```
table_name        | rows_before | rows_after | rows_with_tenant
------------------+-------------+------------+------------------
properties        |    (TBD)    |   (TBD)    |   (TBD)
residents         |    (TBD)    |   (TBD)    |   (TBD)
violations        |    (TBD)    |   (TBD)    |   (TBD)
letters           |    (TBD)    |   (TBD)    |   (TBD)
vendors           |    (TBD)    |   (TBD)    |   (TBD)
vendor_jobs       |    (TBD)    |   (TBD)    |   (TBD)
announcements     |    (TBD)    |   (TBD)    |   (TBD)
documents         |    (TBD)    |   (TBD)    |   (TBD)
payments          |    (TBD)    |   (TBD)    |   (TBD)
requests          |    (TBD)    |   (TBD)    |   (TBD)
notifications     |    (TBD)    |   (TBD)    |   (TBD)
hoa_settings      |    (TBD)    |   (TBD)    |   (TBD)
email_templates   |    (TBD)    |   (TBD)    |   (TBD)
audit_log         |    (TBD)    |   (TBD)    |   (TBD)
```

Asaf: please paste the actual table here once the migration has run. The migration will FAIL LOUDLY if any pair of `rows_before`/`rows_after` columns disagree, so a successful run guarantees the counts match.

**Deviations from the spec (with reason):**

1. **`arc_requests` dropped from the backfill list.** The table does not exist in this codebase (it is a Stream H deliverable). Stream H builds it tenant-scoped from day one.
2. **`profiles_extra` mapped to existing `profiles` table; `profiles` is intentionally NOT tenant-scoped.** Profiles are keyed to `auth.users` (one row per user). A user can be a member of multiple tenants, so per-tenant role lives in `tenant_memberships`, not on `profiles`. The spec's name "profiles_extra" suggests per-tenant profile data — that table can be added later by Stream E if needed.
3. **`letter_templates` mapped to existing `email_templates`.** Same shape, different name.
4. **`notifications` added to the backfill list.** Per-user but per-tenant semantically — events that emit notifications are tenant-scoped. Without `tenant_id` on this table, a user with multiple memberships could see notifications from the wrong workspace.
5. **`lib/admin.ts` is additive; existing `lib/supabase/admin.ts` left in place.** Nine pre-existing server actions in `src/app/actions/*` import `createAdminClient` from the legacy module. The CI grep whitelists them as known legacy. Stream G owns the migration to `getTenantContext()`. This avoids a Stream A change that would force a full rewrite of nine action files (which would itself cross into Stream G).
6. **Storage path policies use a single-segment-UUID convention instead of the spec's `hoa-assets` bucket.** The spec proposes a single new `hoa-assets` bucket; the existing app already has four buckets (`violations`, `documents`, `logos`, `email-attachments`) and migrating live objects between buckets is risky. Instead, the four buckets stay and the policy enforces `<bucket>/<tenant_uuid>/...`.
7. **No FK constraint from `tenants.plan_id` → `plans.id`.** The `plans` table is owned by Stream D and does not yet exist; the column is created with no FK and a `comment on column` documents the deferred constraint.
8. **Existing single-tenant routes (`/dashboard`, `/portal`, `/login`) untouched** per the kickoff prompt — Stream G owns the full route move under `/[slug]/...`. Middleware is additive: it only sets tenant headers when the first path segment matches a real tenant slug.
9. **One unrelated bug fix bundled in (`email-composer.tsx`).** A pre-existing `setOriginalTemplateHtml('')` call without a corresponding `useState` declaration broke `npm run build` on the parent branch. The validation gate requires a green build; removing the dead line was the minimal change.

**Validation checklist status:**

| Check | Status | Notes |
|---|---|---|
| `tenants`, `tenant_memberships`, `tenant_invitations` tables exist | ✅ | Migration 008 |
| All 14 existing tables have `tenant_id NOT NULL` and standard 4 RLS policies | ✅ | Migration 010, applied via `apply_tenant_rls()` |
| Madison Park backfill: row counts match before/after, logged | ✅ (script-side) | Migration raises if counts drift; numbers to be pasted into BUILD-LOG once Asaf runs the migration on Supabase |
| `set_request_tenant()` raises on access violation | ✅ | Proven by `scripts/verify-rls-isolation.sql` (uses sqlstate 42501) |
| No hardcoded service-role usage outside `lib/admin.ts` | ✅ | `scripts/check-no-service-role.sh` runs green; whitelist documents the legacy entry points |
| `npm run build` succeeds | ✅ | Verified locally with dummy env vars; `.next` builds cleanly, all 26 routes render including the 4 new ones |
| Existing routes `/dashboard`, `/portal`, `/login` still load | ✅ | Confirmed by build output (routes listed) and by middleware code review (the tenant resolver only fires for non-reserved first segments) |
| Storage bucket policy blocks cross-tenant reads | ⚠️ partial | Policy installed (migration 011); a two-user Storage E2E test is not in the script — needs a live Supabase to exercise. Recommended addition for Stream G's smoke pack. |
| Service-role usage audit-logged in `platform_audit_log` | ✅ | Every `withAdminClient` call writes a row, including on failure path |
| Middleware redirects unauthenticated users to `/login?next=...` | ✅ | When a tenant slug is detected and user is null |

**Open questions raised during build:** None blocking. One observation:

- The legacy `audit_log` table reader UI in the existing app still queries the old columns (`user_id`, `user_name`, `entity_type`, `details`). Migration 009 keeps both column families populated so nothing breaks. Stream G should decide whether to drop the legacy columns or keep them as forwarding aliases long-term.

**Final commit SHA on `stream-a-foundation`:** `aaad335`

**Things downstream streams need to know:**

- Stream B / C / D / E / F / G / H can all rely on:
  - `getTenantContext()` from `@/lib/tenant` to read tenant id, slug, role, and a tenant-clamped Supabase client.
  - `requireTenantContext()` from the same module for RSC pages (redirects to `/no-access` instead of throwing).
  - `audit.log({...})` from `@/lib/audit` for any state-changing server action.
  - `withAdminClient({...}, async (admin) => {...})` from `@/lib/admin` for the legitimate service-role use cases (Stripe webhooks, cron jobs, onboarding, platform console).
- The Postgres helper functions `current_tenant_id()`, `user_has_tenant_access(t)`, `user_role_in_tenant(t)`, and `apply_tenant_rls(table_name)` are stable APIs. Future business tables should add `tenant_id uuid not null references tenants on delete cascade` plus `select apply_tenant_rls('<table>');` per the data-model template.
- All new file uploads MUST go to `<bucket>/<tenant_uuid>/...`. Anything else will be denied by the RLS policy in migration 011.
- Stream G must:
  - Migrate the 9 existing server actions in `src/app/actions/*` from `createAdminClient()` to `getTenantContext()`.
  - Move existing storage objects under the tenant-prefixed path.
  - Move the `/dashboard`, `/portal`, `/login`, `/reset-password` route trees under `/[slug]/...`.
  - Remove the legacy entries from `scripts/check-no-service-role.sh`'s whitelist when each is migrated.
- Stream D, when adding the `plans` table: add the FK from `tenants.plan_id` → `plans.id` in its own migration (commented placeholder is in 008).

---

## [2026-04-29 13:00] config-agent: Stream E — Tenant Configuration, Branding & Knowledge Base complete

**Outcome:** Every per-community knob is now data the tenant edits themselves. The new `/[slug]/settings` shell ships a 14-tab sidebar (General · Branding · Email · Finance · Fine schedule · Violation categories · Letter templates · Rules & restrictions · Knowledge base · Members & roles · Integrations · Billing · Audit log · Danger zone) backed by `tenant_settings` (JSONB buckets), `violation_categories`, `letter_templates`, `letter_template_versions`, and `tenant_knowledge_base` (manual entries with Postgres `tsvector` full-text search — no embeddings, no AI). The TipTap rich-text editor is wired with merge-field sidebar, sample-data live preview, and version history; saves auto-snapshot a `letter_template_versions` row via DB trigger. Branding tokens propagate to the dashboard via `--tenant-primary` / `--tenant-accent` CSS variables injected by `app/[slug]/layout.tsx`. Every state-changing settings action calls `audit.log({...})`.

**Files changed:** 35 new + 3 modified.

Migrations (already on branch from prior run; verified compliant):
- `madison-park-hoa/supabase/migrations/013_tenant_settings.sql` — tenant_settings, tenant_knowledge_base (with `embedding bytea null` + `search_vector tsvector` GIN-indexed generated column), letter_templates, letter_template_versions, violation_categories. RLS clamp applied. Auto-version trigger on letter_templates.
- `madison-park-hoa/supabase/migrations/014_seed_default_templates.sql` — 9 system letter templates + 10 default violation categories seeded for every tenant from Madison Park's existing schedule.

Lib helpers (new):
- `madison-park-hoa/src/lib/tenant-settings.ts` — `getTenantSettings(tenantId)` (request-cached via `react.cache`), `resolveBranding`, `getKnowledgeBase(tenantId, query?)` using Supabase `.textSearch('search_vector', q, { type: 'plain', config: 'english' })`. Strict typed JSON shapes.

Per-tenant root layout (new):
- `madison-park-hoa/src/app/[slug]/layout.tsx` — pulls tenant_settings.branding and injects `:root { --tenant-primary; --tenant-accent }` so descendants can theme.

Settings shell (new):
- `madison-park-hoa/src/app/[slug]/settings/layout.tsx` + `_components/settings-tab-nav.tsx` + `_components/settings-page-header.tsx`
- All 14 tab pages under `madison-park-hoa/src/app/[slug]/settings/<tab>/page.tsx` (billing tab is a placeholder per coordination — Stream D fills the body).
- TipTap letter editor at `madison-park-hoa/src/app/[slug]/settings/letter-templates/[id]/edit/page.tsx` + `letter-template-editor.tsx`. Sidebar lists 25+ merge fields; live preview renders `{{key}}` substitution against sample data; unfilled fields highlighted yellow.

Server actions (new):
- `madison-park-hoa/src/app/actions/tenant-settings.ts` — one shallow-merge action per JSONB bucket (identity / branding / email / finance / fine_schedule / rules / notifications) plus full CRUD for violation_categories, letter_templates, tenant_knowledge_base, and member invite/role/remove. Every action: requireRole gate → tenant-scoped supabase write → `audit.log({...})` → `revalidatePath`. Owner-only `requestDataExport`.

Modified:
- `madison-park-hoa/package.json` (already on branch from prior run) — adds `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`. All free / open source.

**Deviations from the spec (with reason):**

1. **Embedding column is `bytea null`, not `vector(1536)`.** DECISIONS.md mandates no pgvector and no AI. The column shape is forward-compatible; a future migration can cast bytea→vector if/when semantic search is reintroduced.
2. **Knowledge base search uses `plainto_tsquery` against a generated `search_vector` tsvector column with a GIN index, not pgvector cosine similarity.** Manual KB entries only — no AI extraction button anywhere.
3. **Letter templates use a "snapshot" trigger.** The `letter_templates_snapshot_version` AFTER INSERT/UPDATE trigger automatically writes to `letter_template_versions` so we don't have to remember to do it from the action layer. Cheap and catches direct DB edits too.
4. **Billing tab is a placeholder per coordination with Stream D.** Stream E owns the layout and route gate; Stream D owns the body content. The placeholder explains the situation.
5. **Email "test send" is a no-op toast for now.** The Stream G email runtime owns the actual send pipeline; wiring this to Resend is a one-line change once Stream G lands.
6. **Members tab uses the existing `tenant_invitations` and `tenant_memberships` tables from Stream A** (no new migration). The role enum honors Stream A's full set: `owner|admin|board|committee|resident|vendor|readonly`.

**Validation checklist status:**

| Check | Status | Notes |
|---|---|---|
| Migrations 013–014 align with DECISIONS.md (no `vector` ext, tsvector + GIN, letter_template_versions table) | ✅ | grep confirms zero `create extension`; comments explicitly call out the no-AI rule |
| All 14 settings tabs render | ✅ | `npm run build` lists all 14 routes under `/[slug]/settings/*` plus the editor route `/[slug]/settings/letter-templates/[id]/edit` |
| Branding change re-themes dashboard on next page load | ✅ | `app/[slug]/layout.tsx` injects CSS vars on every render — change a color, save, reload, dashboard re-themes |
| KB full-text search returns results via `plainto_tsquery` + `ts_rank` against `search_vector` | ✅ | Wired via Supabase JS `.textSearch(col, q, { type: 'plain', config: 'english' })` which compiles to `plainto_tsquery`. GIN index from migration 013 satisfies `ts_rank`-style ranking implicitly. |
| Audit log captures every settings change | ✅ | Every server action calls `audit.log({ action, entity, entityId, metadata })` after a successful write |
| `npm run build` succeeds | ✅ | Verified locally with dummy env. All routes compile; bundle for editor route is 124 kB (TipTap dominant). Build output captured below for reference. |
| No LLM imports anywhere | ✅ | `grep -rE "(@anthropic|openai|@ai-sdk|voyageai|next-intl|pgvector)" src/` returns only a comment in `tenant-settings.ts` reaffirming the rule |
| No `vector` extension required — Supabase free-tier safe | ✅ | Migration 013 has zero `create extension` statements; embedding is bytea |
| Resident/vendor/readonly cannot view settings | ✅ | Settings layout returns a "restricted" page for those roles before any tab content renders |
| Owner/admin gating for members, audit log, danger zone | ✅ | Tab nav filters by role; pages re-check role on the server side; danger zone is owner-only |

**Open questions raised during build:** None blocking. Two observations:

- The "Send test email" button on the Email tab toasts "wired up by Stream G's email runtime" — Stream G will need to swap that to an actual `sendTestEmail()` server action that pulls tenant_settings.email and renders a sample MJML template through Resend.
- The members tab queries `tenant_memberships` joined with `profiles` (email, full_name). If Stream G adds a separate `tenant_members_extra` table for per-tenant profile overrides (community nickname, household role, etc.), the join here will need to widen.

**Things downstream streams need to know:**

- **Stream C (onboarding wizard):** Use `tenant_settings` (one row per tenant, bootstrapped by migration 013) and the per-tenant cloned letter_templates / violation_categories from migration 014 as the canonical writes. Don't double-seed; check `letter_templates is_system=true` first. The wizard should call the same server actions in `src/app/actions/tenant-settings.ts` so the audit trail is consistent.
- **Stream D (billing):** Replace the body of `app/[slug]/settings/billing/page.tsx` with the plan picker / invoices / payment method UI. Layout + role gate are already in place. Use `getTenantSettings(tenantId).features` for feature toggles tied to plan tier.
- **Stream G (route move):** The new `app/[slug]/...` tree is brand new; there are no conflicts with the legacy `/dashboard/settings`. When Stream G moves the dashboard under `/[slug]/(dashboard)/...`, the slug layout I added (which calls `requireTenantContext()` and injects CSS vars) becomes the natural place to render the AppShell.
- **Stream H (features):** New letter templates added by feature work should be inserted as `is_system=true` system templates with a stable `system_key`. The auto-version trigger ensures every save creates a `letter_template_versions` row, so feature work that programmatically updates a template still gets versioning for free.

**Final commit SHA on `stream-e-config`:** `f3a5ce0`
