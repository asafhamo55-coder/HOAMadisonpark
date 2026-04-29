# DECISIONS — locked-in choices that override the plan

These are Asaf's final answers to the open questions across all streams, plus
the free-tier strategy. Sub-agents must treat this document as authoritative
where it differs from the original stream specs.

Last updated: 2026-04-29

---

## Brand & domain

- **Product name:** HOA Pro Hub (was "HOA Hub" in the plan docs)
- **Platform domain:** `hoaprohub.app` (Asaf to register at Cloudflare Registrar)
- **Marketing copy and code identifiers:** use "HOA Pro Hub" wherever the plan
  says "HOA Hub". Plan docs themselves are not rewritten — agents apply the
  rename as they go.

## Pricing

- Starter $49 / Standard $129 / Pro $299 monthly (master-plan numbers — Pro
  pricing is what makes future AI economics work)
- Annual discount: **17%** (≈ 2 months free)
- Stripe **test mode only** until the first paying customer + LLC is provisioned

## Tenancy model

- **Madison Park slug:** `madison-park`
- **Slug collisions across states:** suffix with state code (`<base>-<state>`,
  e.g. `sunset-ridge-ga`). Enforce uniqueness at the DB level.
- **Resident logins:** same `auth.users` table as admins. Tenant segmentation
  is enforced strictly via `tenant_memberships` + RLS — zero data crossing
  between tenants.
- **Existing tenant email sender:** keep `noreply@madisonparkhoa.com` for
  Madison Park. New tenants default to a `noreply@hoaprohub.app` sender once
  the domain is registered and DKIM/SPF/DMARC verified in Resend.
- **Cutover:** Madison Park flips to multi-tenant routes immediately when
  Stream G's validation checklist is fully green — no canary period.

---

## Free-tier-only constraint

No paid vendors at this stage. The only unavoidable cost is the domain
registration (~$12/yr).

### Vendor mapping

| Plan called for | Free choice | Notes for agents |
|---|---|---|
| Stripe live mode | **Stripe test mode** | Build full schema, UI, webhooks. Do NOT enable live mode. Webhook secret is the test-mode one. |
| Stripe Tax | **Skip** | No tax calculation in v1. Pricing displayed as flat. |
| Resend paid | **Resend free tier** (already in deps) | 3,000 emails/mo cap. `assertWithinLimit('emails_monthly', ...)` enforces. |
| PostHog paid | **PostHog free tier** | 1M events/mo. Use `posthog-js` + `posthog-node`. |
| Plausible | **Drop** | PostHog covers pageviews. |
| Anthropic API | **NONE — fully removed** | See "AI scope" section below. |
| OpenAI/Voyage embeddings | **NONE** | Knowledge base uses Postgres `tsvector` full-text search instead of pgvector. Keep an `embedding vector(1536)` column nullable in the schema for future use, but don't populate or query it. |
| Twilio (SMS) | **Drop SMS** | Email + PWA push only. |
| Apple Developer + Google Play | **PWA only** (already wired via `next-pwa`) | No Capacitor build. No App Store / Play Store presence. |
| QuickBooks Online sync | **Drop** | Manual CSV export only. |
| Translator services | **Drop** | English only at launch. |
| Sentry | **Skip** | Use Vercel logs only. |
| BetterStack/Statuspage | **Skip** | Add later when first paying customer requests SLA. |
| Vercel Pro | **Vercel free hobby tier** | Acceptable risk re: commercial-use clause for early stage. |
| Supabase Pro | **Supabase free tier** | 500MB DB / 1GB storage / 50K MAU. No daily backups — note in launch runbook. Upgrade only when first paying customer signs. |
| External pen test | **Defer** | Self-review against OWASP Top 10 only. |
| DoorKing/ButterflyMX/Latch | **Drop H15 entirely** | Vendor contracts + hardware out of scope. |

---

## AI scope — fully removed for v1

There is **no Anthropic, OpenAI, Voyage, or any AI/LLM integration** in v1.
The following plan items are affected:

- **Stream C, Step 4 (Governing docs):** Tenants upload PDFs/Word docs. The
  app extracts plain text via `pdf-parse` and stores it in `documents.body_text`
  for full-text search. **No structured-extraction prompt, no Claude call.**
  Knowledge base entries (`tenant_knowledge_base`) are created manually by
  the admin via the Settings → Knowledge Base UI (Stream E).
- **Stream E, Knowledge Base:** Schema unchanged but `embedding` column stays
  null. Search is Postgres full-text (`tsvector` + `plainto_tsquery`) only.
- **Stream G, "AI summary" feature on violations:** Drop. No Anthropic-SDK
  dep in the existing app, so this was aspirational anyway.
- **Stream H feature cut** (final scope below).

## Stream H — final feature scope

### Build in v1 (free, no AI)

- **H3** Scheduled fines & escalation (state machine + cron)
- **H4** Voting & elections
- **H6** Communications — **email + PWA push only**, no SMS
- **H7** PWA-only mobile (no Capacitor build)
- **H8** Maintenance request marketplace — matching only, no payment processing or revenue share
- **H9** Public community pages
- **H10** Open API
- **H11** Vendor portal
- **H12** Insurance & document expiration tracking
- **H13** ARC module

### Dropped entirely

- **H1** AI Document Q&A — needs LLM
- **H2** AI Violation Drafter — needs LLM + vision
- **H5** Financial management QuickBooks sync — keep manual P&L only
- **H14** Multi-language — English only at launch
- **H15** Smart home / gate integrations — vendor contracts out of scope

---

## Other open questions — resolved

- **A.3** Resident auth: same `auth.users` table (recommendation accepted).
- **B.4** Logo strip: not blocking; show with Madison Park only at first.
- **C.1** Demo data: separate sandbox tenant (recommendation accepted).
- **C.2** Default fine schedule values: use Madison Park's existing schedule as the seed default.
- **C.3** Concierge upsell: not now; revisit Phase 2.
- **D.4** Resident seat counting: residents are unlimited; only owner/admin/board/committee/vendor count toward seats.
- **E.1** Conditional letter templates: defer to Phase 2.
- **E.2** White-label footer: keep "Powered by HOA Pro Hub" on all plans for v1; revisit per-plan removal in Phase 2.
- **E.3** Time zone: tenant-level only for v1.
- **F.1** Other platform admins: just Asaf (`role='owner'`) at launch.
- **F.2** Impersonation consent mode: not in v1; owner can impersonate any tenant they have a support reason for, fully audit-logged.
- **F.3** Slack alerts: replace with email-to-Asaf; add Discord/Slack webhook later if needed.
- **G.3** Cancelled-tenant retention: 30 days full retention → anonymize PII → archive aggregates → hard-delete after 7 years. Documented in privacy policy.
- **H.2/H.3/H.4** Become moot — SMS dropped, AI dropped, public pages opt-in by default with admin toggle to enable.

---

## Implementation rules under the free-tier constraint

1. **Stripe test mode lockfile.** A CI check fails the build if the publishable key starts with `pk_live_` until `LIVE_BILLING_ENABLED=true` is set as an env var.
2. **No new paid SDKs.** Adding any SDK that requires a paid account is a planning-level change — agents must surface as an open question, not silently install.
3. **PostHog gating.** All `posthog.capture(...)` calls must be no-ops if `NEXT_PUBLIC_POSTHOG_KEY` is unset, so local development needs no account.
4. **Email caps respected from day one.** Resend free tier = 100/day, 3000/mo. The `assertWithinLimit` helper enforces this even on dev to catch runaway loops.
5. **Supabase free tier guards.** Migrations don't enable extensions that require a paid plan (e.g., `pg_cron` is fine on free; `wrappers` is not).

---

## What this changes about the streams

- **Stream A:** No change — pure plumbing, all free.
- **Stream B:** Drop Plausible, all references; product name → "HOA Pro Hub".
- **Stream C:** Step 4 governing-doc AI flow becomes "upload + text extraction only".
- **Stream D:** Stripe in test mode only; live-mode promotion is a launch checklist item.
- **Stream E:** KB schema keeps `embedding` column nullable; search uses tsvector; manual KB entry only.
- **Stream F:** Slack → email; no PostHog→Stripe revenue chart unless data is reachable; impersonation as designed.
- **Stream G:** No change to mechanics. Drop the "AI summary" line from validation checklist.
- **Stream H:** Use the v1 scope table above. Skip H1, H2, H5-QB, H14, H15.
