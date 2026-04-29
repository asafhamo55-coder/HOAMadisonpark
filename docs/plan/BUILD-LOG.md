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

## [2026-04-29 02:15] Orchestrator: Stream A complete on `stream-a-foundation`

**Outcome:** arch-agent landed 10 commits with 17 files changed (2,192 +, 62 −). Migrations 008–011 (tenants, audit, existing-tables alter, storage policies), `lib/{tenant,admin,audit}.ts`, additive middleware, 4 auth pages, 2 verification scripts. Validation gate green except live-DB checks (pending Asaf running migrations on the live Supabase project).

**Final commit on `stream-a-foundation`:** `7963420`
**Action item for Asaf:** apply migrations 008–011 to live Supabase, then paste `select * from public.tenant_backfill_audit order by id;` so we can fill the `(TBD)` row counts.

---

## [2026-04-29 02:30] Orchestrator: Phase 2 fan-out — 5 sub-agents launched in parallel

Branched from `stream-a-foundation`:
- `stream-b-marketing` (marketing-agent)
- `stream-c-onboarding` (onboarding-agent)
- `stream-d-billing` (billing-agent)
- `stream-e-config` (config-agent)
- `stream-g-retrofit` (migration-agent)

Each launched in its own git worktree with `DECISIONS.md` as authoritative.

---

## [2026-04-29 02:50] Orchestrator: Phase 2 INTERRUPTED — sub-agent usage cap hit

**Outcome:** All 5 Phase 2 sub-agents exited early with `"You're out of extra usage · resets 3:30am (UTC)"` after producing roughly one commit each plus some uncommitted partial work. The orchestrator (this session) salvaged everything and pushed to the correct branches so nothing is lost.

**Per-stream status after salvage:**

| Stream | Commits on branch | What landed | What's missing |
|---|---|---|---|
| **B (marketing)** | 1 (salvage only) | `components/marketing/{hero,feature-grid}.tsx` (233 lines) | All 8+ pages, signup form, login flow, SEO files, PostHog wiring |
| **C (onboarding)** | 2 (1 by agent + 1 salvage) | Migration 012 + onboarding deps (papaparse, xlsx, pdf-parse); `lib/onboarding/{csv-import,pdf-text,sample-data,slug}.ts` (829 lines) | Wizard shell, all 7 step pages, server actions, sandbox tenant flow |
| **D (billing)** | 2 (1 by agent + 1 salvage) | Plans/subs/invoices/usage/addons schema migration (D1); `lib/stripe.ts` + Stripe SDK install | Webhook handler, checkout/portal endpoints, billing UI, limits helper, trial cron, live-mode lockfile verification |
| **E (config)** | 2 (1 by agent + 1 salvage) | tenant_settings + KB + letter_templates schema migration (E1); package.json updates (likely TipTap) | Seed migration, settings UI shell, all 14 tab pages, branding propagation, KB UI, letter editor |
| **G (retrofit)** | 1 (salvage only) | `components/tenant-provider.tsx`, `lib/tenant-path.ts` (108 lines) | Route move (the big refactor), all 9 server action retrofits, hardcoded-string elimination, legacy `lib/supabase/admin.ts` removal |

**Salvage operation:**
- Two of five worktrees auto-cleaned (B and G — agents got cut off before committing). Their partial files leaked into the parent checkout and were copied to `/tmp/salvage/`, then committed to the correct stream branches.
- Three worktrees (C, D, E) survived with uncommitted changes; commits added by orchestrator (with `Orchestrator (salvage)` author) to preserve them.
- All worktrees unlocked and removed.

**Files changed:** 12 new files committed across 5 branches via salvage; 3 new salvage commits + 4 author commits = 9 new commits total.

**Tests:** Not run — too little of each stream landed to be worth testing in isolation. `npm run build` likely fails on every Phase 2 branch right now because partial code doesn't compose.

**Open questions raised by interrupt:**

1. **Resume strategy.** Two options:
   - (a) Wait for the per-account usage to reset at 3:30am UTC, then re-spawn the same 5 sub-agents with prompts that tell them to pick up from current branch state. Risk: same cap may hit again.
   - (b) Have the orchestrator (this session) finish Phase 2 directly without spawning sub-agents. Lower throughput (sequential, not parallel) but no usage-cap risk.
2. **Whether to keep partial schemas live.** Migrations 012 (Stream D plans), 012 (Stream C onboarding_progress), and 013 (Stream E tenant_settings) all exist as files on their branches but conflict with each other on numbering. Need a coordinated renumber when we merge: probably 012=plans (D), 013=tenant_settings (E), 014=onboarding_progress (C). Each agent will need to rename on resume.

**Awaiting Asaf direction.**

---

## [2026-04-29 19:35] Asaf: Stream A migrations applied to live Supabase

**Outcome:** Migrations 008, 009, 010, 011 applied successfully to the production Supabase project (Madison Park HOA). Migration 010 required a one-line fix (commit `a2f0f8d` on `stream-a-foundation`): the index step assumed every legacy table has a `created_at` column, but the pre-existing `hoa_settings` (from migration 002) only has `updated_at`. The fix adds an `information_schema.columns` check to fall back to a simple `(tenant_id)` index when `created_at` is missing.

**Madison Park backfill — actual row counts (zero data loss across all 14 tables):**

| Table | rows_before | rows_after | rows_with_tenant |
|---|---:|---:|---:|
| properties | 49 | 49 | 49 |
| residents | 58 | 58 | 58 |
| violations | 2 | 2 | 2 |
| letters | 13 | 13 | 13 |
| vendors | 4 | 4 | 4 |
| vendor_jobs | 0 | 0 | 0 |
| announcements | 1 | 1 | 1 |
| documents | 1 | 1 | 1 |
| payments | 0 | 0 | 0 |
| requests | 0 | 0 | 0 |
| notifications | 0 | 0 | 0 |
| hoa_settings | 4 | 4 | 4 |
| email_templates | 11 | 11 | 11 |
| audit_log | 11 | 11 | 11 |

Madison Park tenant id: `21e9222c-7c49-4f5a-9ae4-4ab884b736ca`. Migration 010 was idempotent and ran twice cleanly (28 rows in `tenant_backfill_audit` = 14 tables × 2 runs).

**Still to apply:** 012 (Stream D plans/billing), 013 (Stream E tenant_settings/KB), 014 (Stream E seed templates), 015 (Stream C onboarding_progress).
