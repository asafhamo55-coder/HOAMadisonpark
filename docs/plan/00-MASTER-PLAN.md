# HOA Hub — Multi-Tenant SaaS Platform
## Master Plan for Claude Code Multi-Agent Build

**Owner:** Asaf
**Source app:** Madison Park HOA (Next.js 15, TypeScript, Tailwind, shadcn/ui, Supabase)
**Target:** Multi-tenant SaaS platform where any HOA / community can sign up, onboard, configure, pay, and operate independently. Madison Park becomes tenant #1.
**Build strategy:** Multi-Claude orchestration — one Orchestrator agent + specialized parallel agents per stream.

---

## 1. Vision

**HOA Hub** is a vertical SaaS platform for residential communities (HOAs, COAs, master-planned, townhome, condo, sub-associations). One codebase, one database, isolated tenants. Each community gets:

- Their own branded portal (logo, colors, domain/subdomain)
- Their own residents, properties, violations, vendors, letters, payments, documents
- Their own governing documents structured as a queryable knowledge base
- Their own configuration (fines, dues, fiscal year, leasing rules, rule categories)
- Their own users with roles (admin, board, committee, resident, vendor)
- Strict data isolation enforced at the database (Postgres RLS) and application layer

The platform itself has:
- Public marketing site with pricing tiers
- Self-serve sign-up with 14-day trial
- Stripe-powered subscriptions and billing
- A super-admin "Platform Console" for Asaf (tenant ops, support, plan changes, churn)
- A guided onboarding wizard that gets a new community live in under 30 minutes

Madison Park is tenant `madison-park` and Asaf logs in through the same app.

---

## 2. Core principles

1. **Tenant-first data model.** Every business table has `tenant_id uuid not null`. RLS policies clamp every query to the caller's tenant. No exceptions.
2. **Migrate, don't fork.** Every existing Madison Park feature gets retrofitted with `tenant_id`. We do not maintain two codebases.
3. **Configuration over code.** Anything that varies between communities (fine schedule, fiscal year, leasing cap %, violation categories, letter templates, branding) is data, not code.
4. **Idempotent onboarding.** A new tenant can be created, populated, and torn down without manual DBA work.
5. **Self-serve first, white-glove second.** Free trial requires zero human intervention. Paid plans can opt into concierge onboarding.
6. **Compliance posture from day one.** Soft deletes, audit log, PII tagging, export-on-request, GDPR/CCPA-ready, even if not yet certified.
7. **Single source of truth.** One Supabase project, one Stripe account, one Resend domain, one Vercel deployment.

---

## 3. Architecture (high level)

```
                          ┌─────────────────────────────┐
                          │   hoahub.app (marketing)    │
                          │   /pricing /signup /demo    │
                          └────────────┬────────────────┘
                                       │
                                       ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  app.hoahub.app  (Next.js 15 App Router · single deployment) │
   │                                                              │
   │  /platform/*        → Super-admin console (Asaf)             │
   │  /onboarding/*      → New tenant wizard                      │
   │  /[tenant]/*        → Tenant workspace (admin / board)       │
   │  /[tenant]/portal   → Resident-facing portal                 │
   │  /api/*             → Server actions, webhooks, cron         │
   └────────────┬─────────────────────────────────────────────────┘
                │
                ▼
   ┌──────────────────────┐  ┌────────────────┐  ┌────────────────┐
   │ Supabase Postgres    │  │ Stripe Billing │  │ Resend (email) │
   │ + Auth + Storage     │  │ Subs + Trials  │  │ Per-tenant     │
   │ + RLS per tenant     │  │ + Invoices     │  │ branding       │
   └──────────────────────┘  └────────────────┘  └────────────────┘
```

**Tenant routing:** path-based (`/[tenant]/...`) for v1. Custom domains (`madisonpark.hoahub.app` and later `portal.madisonparkhoa.com`) come in v2.

**Auth:** Supabase Auth. A user can belong to multiple tenants via a `tenant_memberships` join table (so a property manager who runs three HOAs uses one login).

---

## 4. Plans & pricing (initial — tunable by Asaf in Platform Console)

| Plan | Monthly (annual disc.) | Properties | Seats | Key features |
|---|---|---|---|---|
| **Trial** | Free, 14 days | up to 25 | 3 admin | Full Starter features, no credit card required |
| **Starter** | $49 / mo | up to 50 | 5 admin | Properties, residents, violations, letters (200/mo), announcements, document library, basic dashboard |
| **Standard** | $129 / mo | up to 200 | 15 admin | Everything in Starter + payments/dues, ARC requests, vendor management, audit log, custom letter templates, 1,500 emails/mo |
| **Pro** | $299 / mo | up to 500 | unlimited admin | Everything in Standard + AI document Q&A, AI violation drafting, scheduled fines, voting/elections, financial reports, API access, 10,000 emails/mo |
| **Enterprise** | Custom | unlimited | unlimited | Custom domain, SSO/SAML, dedicated success manager, custom integrations, SOC 2, BAA available |

Add-ons (any plan): extra properties ($1/property/mo over cap), extra emails ($10 / 1,000), AI credit packs, white-label branding, SMS notifications.

---

## 5. Stream / agent breakdown

We build with one **Orchestrator** agent that owns the plan and delegates to **8 parallel streams**. Each stream has its own document in this folder. Streams that touch the same files coordinate through the Orchestrator.

| # | Stream | Agent name | Document | Depends on |
|---|---|---|---|---|
| A | Foundation & multi-tenant migration | `arch-agent` | `01-stream-A-foundation.md` | — |
| B | Marketing site + pricing + signup | `marketing-agent` | `02-stream-B-marketing.md` | A |
| C | Tenant onboarding wizard | `onboarding-agent` | `03-stream-C-onboarding.md` | A |
| D | Billing & subscriptions (Stripe) | `billing-agent` | `04-stream-D-billing.md` | A |
| E | Tenant configuration & branding | `config-agent` | `05-stream-E-config.md` | A |
| F | Platform super-admin console | `platform-agent` | `06-stream-F-platform.md` | A, D |
| G | Existing module retrofit (RLS + tenant_id) | `migration-agent` | `07-stream-G-retrofit.md` | A |
| H | New SaaS features (AI, voting, comms, mobile) | `feature-agent` | `08-stream-H-features.md` | A, G |

Plus cross-cutting:
- `09-data-model.md` — full ERD and migration scripts
- `10-design-system.md` — branding tokens, component conventions
- `11-testing-and-launch.md` — test matrix, staging, go-live checklist

---

## 6. Multi-Claude orchestration recipe

Drop this in Claude Code as your first prompt:

```
You are the Orchestrator for the HOA Hub multi-tenant SaaS build.
The plan is in /docs/plan/00-MASTER-PLAN.md and stream files 01-11.

Your job:
1. Read 00-MASTER-PLAN.md and 09-data-model.md fully.
2. Spawn parallel sub-agents for streams A through H, one Task tool call per stream,
   in dependency order. Stream A first; B, C, D, E, G in parallel after A; F after D;
   H after G.
3. For each sub-agent, pass it ONLY its stream document plus 09-data-model.md and
   10-design-system.md as context. Tell it to return a summary of what it built and
   any decisions it made.
4. After each stream completes, run the validation checklist at the bottom of that
   stream's document. Do NOT let a stream "complete" if its checklist fails.
5. Maintain a running log at /docs/plan/BUILD-LOG.md with timestamp, stream, summary,
   and open questions.
6. When a stream raises an open question that requires Asaf's input, stop that stream
   and surface the question in the chat — do not guess.
7. After all streams pass their checklists, run 11-testing-and-launch.md end to end.

Rules:
- Never bypass RLS. Service role key is used only in server actions and webhooks.
- Never store secrets in client code or commit them.
- Every new table gets tenant_id + RLS + an index on (tenant_id, created_at).
- Madison Park data must be preserved through the migration. Run the migration on
  a branch first and diff row counts.
```

---

## 7. Roadmap

**Phase 1 — MVP (target: 4 weeks of agent-time)**
Stream A, B, C, D, E, G. Madison Park migrated. Two paid pilot communities onboarded.

**Phase 2 — Growth (weeks 5–8)**
Stream F (platform console), Stream H selected features (AI doc Q&A, scheduled fines, ARC), Stripe metered usage, referral program.

**Phase 3 — Scale (weeks 9–16)**
Custom domains, SSO, SOC 2 prep, mobile app (PWA → Capacitor), public API, marketplace for vendors, multi-language (Spanish, Hebrew).

---

## 8. Success metrics (instrumented from day 1)

- Time from signup to first resident imported (target: < 15 min)
- Trial → paid conversion (target: 20% Phase 1, 30% Phase 2)
- Monthly recurring revenue (MRR), net revenue retention (NRR)
- Tenant DAU / WAU / MAU
- Letters sent per tenant per month (correlates with stickiness)
- Time-to-resolution for violations
- Support tickets per tenant per month (target: < 1)

All instrumented via PostHog (events) + Stripe (revenue) + a Platform Console dashboard.

---

## 9. Files in this plan

```
docs/plan/
├── 00-MASTER-PLAN.md             ← this file
├── 01-stream-A-foundation.md     ← multi-tenant core, auth, RLS framework
├── 02-stream-B-marketing.md      ← marketing site, pricing, signup
├── 03-stream-C-onboarding.md     ← onboarding wizard
├── 04-stream-D-billing.md        ← Stripe, plans, trials, invoices
├── 05-stream-E-config.md         ← per-tenant settings, branding, knowledge base
├── 06-stream-F-platform.md       ← super-admin console
├── 07-stream-G-retrofit.md       ← migrate existing modules to multi-tenant
├── 08-stream-H-features.md       ← new SaaS features
├── 09-data-model.md              ← full ERD + SQL migrations
├── 10-design-system.md           ← tokens, components, theming
└── 11-testing-and-launch.md      ← QA, staging, go-live
```

Read `09-data-model.md` next, then jump to whichever stream you want to start.
