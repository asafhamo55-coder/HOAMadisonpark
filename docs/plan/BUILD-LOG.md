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
