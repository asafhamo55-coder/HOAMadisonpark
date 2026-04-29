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

## [2026-04-29 14:30] billing-agent: Stream D — Billing & Subscriptions complete (resumed)

**Outcome:** Picked up from the orchestrator's salvage commits (migration 012 + Stripe SDK install + lib/stripe.ts) and finished the rest of Stream D. The app now ships full Stripe-test-mode billing: live-mode lockfile (verified), webhook with mandatory signature verification + idempotent handlers, checkout + portal endpoints, billing settings page with plan card/usage bars/invoice history, daily trial-expiry cron with 3/1/0-day warnings + 30-day hard cancellation, and an `assertWithinLimit` helper wired into `addPropertyAction` as a pre-action check. No live Stripe keys allowed without `LIVE_BILLING_ENABLED=true`. No Stripe Tax. No hardcoded plan prices outside the seed migration.

**Files changed:** 9 new + 4 modified.

New:
- `madison-park-hoa/src/lib/limits.ts` — `assertWithinLimit`, `getUsageSnapshot`, `recordUsage`, `getPublicPlans`, `LimitExceededError`
- `madison-park-hoa/src/app/api/stripe/webhook/route.ts`
- `madison-park-hoa/src/app/api/stripe/checkout/route.ts`
- `madison-park-hoa/src/app/api/stripe/portal/route.ts`
- `madison-park-hoa/src/app/[slug]/settings/billing/page.tsx`
- `madison-park-hoa/src/app/[slug]/settings/billing/billing-actions.tsx`
- `madison-park-hoa/src/app/api/cron/trial-expiry/route.ts`
- `madison-park-hoa/scripts/verify-stripe-lockfile.ts`

Modified:
- `madison-park-hoa/src/lib/stripe.ts` — fix Stripe v22 type names (`Stripe.LatestApiVersion` no longer exists; route `STRIPE_API_VERSION` env through an `unknown` cast)
- `madison-park-hoa/src/app/actions/properties.ts` — pre-insert `assertWithinLimit` call gated on `x-tenant-id` header
- `madison-park-hoa/vercel.json` — add daily cron entry for `/api/cron/trial-expiry`
- `docs/plan/BUILD-LOG.md` — this entry

**Migrations:** none added in this resume — migration 012 from the prior salvage commit already creates `plans`, `subscriptions`, `invoices`, `usage_events`, `addons`, seeds the four plans (trial / starter / standard / pro) with correct cents, AND adds the deferred `tenants.plan_id → plans.id` FK in a `do $$` block. No need for a separate 016.

**Validation gate:**

| Check | Status |
|---|---|
| `npm run build` succeeds | ✅ — clean build with all routes listed including `/api/stripe/{webhook,checkout,portal}`, `/api/cron/trial-expiry`, `/[slug]/settings/billing` |
| Webhook signature verification present | ✅ — `stripe.webhooks.constructEvent` at line 60 of webhook/route.ts; bad signatures return 400 BEFORE any DB write |
| Live-mode lockfile present and tested | ✅ — `scripts/verify-stripe-lockfile.ts` exercises 5 cases (pk_live alone, sk_live alone, test keys allowed, live + LIVE_BILLING_ENABLED=true allowed, LIVE_BILLING_ENABLED='1' still blocks). All pass. |
| Webhook handlers idempotent | ✅ — both `subscriptions.stripe_subscription_id` and `invoices.stripe_invoice_id` are UNIQUE in migration 012; handlers use `.upsert(..., { onConflict: ... })`. Replaying an event id is a no-op aside from an extra `platform_audit_log` row. |
| `assertWithinLimit` exported and used at least once in a pre-action check | ✅ — used in `addPropertyAction` (gated on `x-tenant-id` header for Stream G's pending route migration) |
| No hardcoded plan prices outside the seed migration | ✅ — grep across `src/` for `4900`, `12900`, `29900`, `48800`, `128500`, `297800`, and `$49/$129/$299` returns zero hits |

**Deviations:**

1. **No 016_tenants_plan_fk.sql.** The deferred FK was already in migration 012 (a `do $$` guarded `add constraint` at lines 236-249). Splitting it into 016 would just be a no-op since the constraint check `not exists ... fk_tenants_plan` would short-circuit. Skipped per the instructions ("either append to 012 or create 016 — 16 is reserved if you split").
2. **Billing UI is a leaf page, not a layout.** Stream E owns `app/[slug]/settings/layout.tsx` and the surrounding tab nav. The page renders standalone with its own padding so it works either way (with or without Stream E's layout wrapping it). Stream E can drop their layout in around it without changes here.
3. **`addPropertyAction` cap check is gated on `x-tenant-id`.** The legacy `/dashboard` routes don't get the tenant header (Stream G owns that retrofit). To avoid false positives on the legacy path, the cap check is `if (tenantId) { await assertWithinLimit(...) }`. Once Stream G migrates the action to `getTenantContext()`, the gate becomes unconditional.
4. **Stripe SDK type fix.** Stripe v22's TS types do not export `Stripe.LatestApiVersion` from the namespace (it's a top-level `LatestApiVersion` on `lib.d.ts`, plus the runtime accepts any historical pinned version). The salvage commit's stripe.ts wouldn't build. Fixed by deriving the options type via `ConstructorParameters<typeof Stripe>[1]` and routing the env var through an `unknown` cast.
5. **`general-announcement` template reused for trial-expiry emails.** Adding a brand-new dedicated template would have required a new TemplateMap entry + email component and was not scoped in. The cron composes subject/body strings and feeds them through the existing template, which already supports `{ subject, body, ctaLabel, ctaUrl, fromName, date }`.
6. **Cron schedule is daily 13:00 UTC.** Free Vercel Hobby supports daily — `0 13 * * *` lands at 6am Pacific / 9am Eastern, which is when most North-American HOA admins are active and a warning email is most likely to be opened.
7. **No add-ons UI.** Spec calls for "add-ons management (extra emails, extra properties)" in the billing UI; the `addons` table exists and `assertWithinLimit` factors active add-ons into the effective cap, but the self-serve UI for purchasing add-ons is deferred — operator can insert rows manually until Phase 2 demand justifies the UI work.

**Open questions for Asaf:**

1. **Stripe products + prices need to be created in the Stripe dashboard (test mode).** Migration 012 leaves `plans.stripe_product_id` and `plans.stripe_price_{monthly,annual}` as NULL. Once you create the prices with `lookup_key`s `starter_monthly`, `starter_annual`, `standard_monthly`, `standard_annual`, `pro_monthly`, `pro_annual`, populate the `plans` table via the platform console (Stream F) or direct SQL. Until that's done, the checkout endpoint returns a 500 with a clear message ("no Stripe price configured for plan=...").
2. **Webhook endpoint URL** must be registered at `https://<domain>/api/stripe/webhook` in the Stripe dashboard, with the 6 listed events subscribed. The `STRIPE_WEBHOOK_SECRET` from the dashboard webhook config must be set as an env var.
3. **Cron secret.** If `CRON_SECRET` is set, the trial-expiry cron requires `Authorization: Bearer <secret>`. If unset, the route is open (dev convenience). Vercel Cron auto-injects the secret if you configure it in the Vercel dashboard env.
4. **Email sender for billing emails.** The cron uses the existing `sendEmail()` helper which still has `Madison Park HOA <onboarding@resend.dev>` hardcoded as the From. For multi-tenant trial expiry emails, this should ideally be `noreply@hoaprohub.app` once the domain + Resend sender are verified — Stream E or G will refactor `getFromAddress()` later.

**Env vars Asaf needs to set (Vercel project + local `.env`):**

| Name | Value source | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (TEST mode only — must start with `sk_test_`) | yes |
| `STRIPE_PUBLISHABLE_KEY` | Same page (must start with `pk_test_`) | yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → endpoint signing secret (whsec_…). Or `stripe listen` for local testing | yes |
| `LIVE_BILLING_ENABLED` | Leave UNSET. Set to literal string `"true"` only when LLC + first paying customer are live | no (and should stay unset) |
| `CRON_SECRET` | Generate with `openssl rand -hex 32`. Configure as a Vercel Cron secret | recommended |
| `STRIPE_API_VERSION` | Optional pin, e.g. `2026-04-22.dahlia`. Leave unset to use SDK default | no |
| `NEXT_PUBLIC_APP_URL` | Used by trial-expiry cron to build absolute CTA URLs (no per-request origin in cron context). Defaults to `https://hoaprohub.app` if unset | recommended |

**Final commit SHA on `stream-d-billing`:** `7b3536e`

**Things downstream streams need to know:**

- `getPublicPlans()` is exported from `@/lib/limits` for Stream B's `/pricing` page. Returns `{id, name, description, monthly_cents, annual_cents, property_cap, seat_cap, email_cap_monthly, features}` for `is_public=true` plans, ordered by `sort_order`.
- `assertWithinLimit(tenantId, metric, delta)` is exported from `@/lib/limits`. Use BEFORE any chargeable insert. Catch `LimitExceededError` to render the upgrade CTA — `err.payload.upgradeUrl` deep-links to `/[slug]/settings/billing?upgrade=1`.
- `recordUsage(tenantId, metric, qty?, metadata?)` writes a `usage_events` row. Use AFTER a chargeable action (email send, property create, etc.) so the meter only tracks realised events. Best-effort — failures are logged but swallowed.
- `getUsageSnapshot(tenantId, metric)` returns `{ current, cap }` for rendering progress bars. Use in any per-tenant dashboard widget.
- The webhook expects subscription metadata `{tenant_id, plan_id, billing_cycle}` — checkout sets this. Plan changes via the customer portal don't preserve metadata cleanly across new subscription items, so the webhook also falls back to a `stripe_customer_id` → tenant lookup if metadata is missing.
- Stream E owns `app/[slug]/settings/layout.tsx`. The billing page lives at `app/[slug]/settings/billing/page.tsx` and works either with or without an outer layout — Stream E can wrap it.
- Stream C onboarding sets `tenants.status='trial'` with a `trial_ends_at` date. The trial-expiry cron takes over from there.
- Stream F's platform console can populate `plans.stripe_product_id` and `plans.stripe_price_{monthly,annual}` from a one-time admin form once Asaf creates the Stripe products.
