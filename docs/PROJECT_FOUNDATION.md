# Stoop — Project Foundation

**Status:** Living document. Read at the start of every Claude Code session. Update when reality contradicts a section.
**Last revised:** 2026-05-04
**Source:** Reconstructed from a guided Q&A with the founder; prior planning artifacts were not available.

---

## 1. Product

| Field | Value |
|---|---|
| Working name | **Stoop** *(trademark / domain not yet verified — see §11)* |
| One-liner | Self-service HOA management software for self-managed homeowner associations. |
| Tenant model | Multi-tenant SaaS. Each HOA is an organization. Madison Park HOA (Johns Creek, GA) is tenant #1; its data stays in the shared Supabase DB and gets migrated under a new `org_id` without loss. |
| First tenant live date | Already live (Madison Park, single-tenant codebase) |
| Tenant #2 target | Month 3 |

---

## 2. Wedge

The entry point is the **homeowner portal**, not the admin dashboard.

User journey:
1. A board member (also a homeowner) lands on Stoop and signs up as a portal user.
2. From the portal they navigate to "HOA Management" and **create or claim** their HOA.
3. They invite the rest of the board and residents.

Why this works for self-managed HOAs:
- Buyer and user are the same person — no committee sale.
- Board member experiences resident-side value first, then converts to admin.
- Bottom-up adoption is cheap — no demos, no field sales.

**Operational hook (the feature that makes them stay):** Violations workflow → letters → email send. This is the most painful manual task self-managed boards do, and it's the most complete module already built.

---

## 3. ICP

| Dimension | Value |
|---|---|
| Segment | Self-managed HOAs (volunteer boards, no professional management company) |
| Size sweet spot | 50–300 doors |
| Geography | Georgia / Southeast first (founder proximity, Madison Park as reference); national post-tenant-5 |
| Persona | Board president or HOA secretary; medium technical comfort; low pain tolerance (volunteer, unpaid) |
| Out of scope (v1) | Professionally-managed associations, condo associations, communities >500 doors |

A property-management tier is referenced in pricing (§4) but **deferred to v1.5**. Product, GTM, and integrations in v1 are built for self-managed only.

---

## 4. Pricing

### HOA tier (v1) — by community size

| Tier | Doors |
|---|---|
| Small | 1–50 |
| Medium | 51–100 |
| Large | 100+ |

> Open: dollar amounts per tier. Set before tenant #2 sales conversation. *(User input said "above 50" twice — interpreted as a typo for "100+". Confirm.)*

### Property management tier (v1.5)

Same banding by number of properties under management.

### Eviction module (à la carte)

Not yet built. Billed **per eviction event**, not monthly. Fits self-managed boards that handle 0–3 evictions/year and won't pay monthly for rare features.

### Billing direction

**Inbound only.** Stoop charges the HOA a SaaS subscription (Stripe). Stoop does **not** collect dues from residents on behalf of the HOA. The existing `payments` table is record-keeping only.

---

## 5. Modules

The Madison Park codebase contains all listed modules. Cut list for the multi-tenant v1:

### Core (must work for tenant #2)

| Module | Status | Action |
|---|---|---|
| Org / tenant onboarding | Not built | New — see Migration plan §5 |
| Auth & roles | Built | Add org context; `admin`/`board` become org-scoped |
| Properties & Residents | Built | Drop Johns-Creek-specific defaults (zip 30022, city, state) |
| Violations + Letters | Built | Lead module. Per-org letter templates. |
| Email Center (Resend) | Built | Per-org from-address; per-org template overrides |
| Documents | Built | Storage paths scoped by `org_id` |
| Announcements | Built | Org-scoped |
| Notifications (realtime) | Built | Org-scoped subscriptions |
| Audit log | Built | Org-scoped |
| Resident portal | Built | Wedge entry point — polish first |

### Generalize (works for MP, needs decoupling)

| Module | Action |
|---|---|
| Payments ledger | Treat as "Dues tracker." Record-only; outbound collection out of scope. |
| Vendors + Work Orders | Carry forward as-is, org-scoped. May go unused by some tenants — fine. |
| Maintenance requests | Carry forward as-is, org-scoped. |
| Settings / branding | Per-org (HOA name, logo, colors, board president name). Currently env-var-driven. |

### Defer (post-v1)

- Eviction module (in pricing, not built — scope and build for v1.5)
- Property management mode (multi-HOA admin view)
- SMS / Twilio (not free-tier)
- Calendar integrations (Google/Microsoft — limited free APIs)
- Board meeting minutes flow

### Drop / rework heavily

- Madison-Park-hardcoded values: HOA name env var, logo, default zip 30022, default city Johns Creek, default state GA, board-president-name env. Replace with per-org settings rows.

---

## 6. Architecture

### Multi-tenancy strategy — confirmed

Shared Postgres database, shared Supabase project, **row-level isolation by `org_id`**. Madison Park's data is preserved with a new `org_id` and continues to live in the same DB.

Invariants:
- Every domain table has `org_id uuid not null` referencing `organizations(id)`.
- Every RLS policy gates on `org_id = public.current_org_id()` *and* the existing role check.
- Storage paths become `{bucket}/{org_id}/...`.
- Realtime channels filter by `org_id`.
- A `current_org_id()` Postgres function reads from the user's `profiles.org_id`.

Full technical plan: [`MULTI_TENANCY_MIGRATION.md`](./MULTI_TENANCY_MIGRATION.md).

### Routing

**Path-based first:** `stoop.app/o/{org-slug}/...`. Subdomains (`madisonpark.stoop.app`) deferred — they require per-tenant SSL provisioning.

### Onboarding flow (the wedge in code)

1. `/signup` — homeowner-style signup. Creates `auth.users` + `profiles` row, no org.
2. After sign-in, user lands on `/portal` showing an empty state.
3. CTA: "Are you on a board? Manage your HOA →" navigates to `/onboarding/create-org`.
4. Form collects HOA name, address, size tier, founding board members. Creates `organizations` row, sets `profiles.org_id` and `profiles.role = 'admin'` for the user, seeds default templates and categories.
5. User dropped into `/dashboard`.

### Stack — unchanged

Next.js 14 App Router, Supabase (Postgres + Auth + Storage + Realtime), Tailwind + shadcn/ui, Resend + React Email, Vercel.

---

## 7. Integrations — free tier only

| Need | Service | Free tier limit | OK for v1? |
|---|---|---|---|
| DB / Auth / Storage / Realtime | Supabase | 500 MB DB, 1 GB storage, 50K MAU | Yes |
| Email | Resend | 3,000/mo, 100/day | Yes; revisit at ~5 active tenants |
| Hosting | Vercel | Hobby | Yes until ~100 GB bandwidth/mo |
| Subscription billing | Stripe | No monthly fee, ~2.9%+30¢ per charge | Yes |

Deliberately deferred (paid only or limited free): Twilio SMS, QuickBooks, Plaid, AppFolio/Buildium, DocuSign, calendar APIs.

---

## 8. Constraints

### NICE employment

The founder (current NICE employee) has assessed that HOA software is **non-competing** with NICE's product line (contact center / CX / cloud). This is the founder's own interpretation; **no formal employment-counsel review has been done**.

What this affects today:
- Product is being built openly under the founder's name.
- No moonlighting-clause analysis done.
- IP-assignment scope (does the agreement assign all IP, or only IP related to NICE's business?) is unverified.

See §11 risk #2.

### "Stoop" name

Working name. Trademark search and `.com` availability not done. Known collisions in adjacent spaces (real estate, food). Verify before any public marketing or domain commitment.

---

## 9. Timeline & sales motion

| Milestone | Target |
|---|---|
| Madison Park migrated to multi-tenant (tenant #1) | Month 1 |
| Public signup live, onboarding flow polished | Month 2 |
| Tenant #2 signed and live | **Month 3** |
| Tenant #5 | Month 6 |
| Eviction module shipped | Month 6–9 |
| Property-management tier (v1.5) | Month 9–12 |

**Sales motion:** Bottom-up, founder-led. The wedge is the homeowner portal — board members find it themselves. Outbound only as needed for the first 2–3 reference customers.

**Channel priority:**
1. Direct outreach to Georgia self-managed HOA boards (LinkedIn, public board email lists).
2. Madison Park as reference — board-to-board referrals.
3. SEO / long-tail content ("how to send HOA violation letter," etc.) — slow but cheap.
4. *Deferred:* Conferences, partnerships with management companies (wrong ICP for v1).

---

## 10. Open questions

Unresolved; need answers before Month 3.

1. **Pricing dollar amounts.** Tiers defined; numbers TBD. Set before first sales conversation.
2. **Eviction module scope.** Referenced in pricing, not built. What's the workflow? What docs does it generate?
3. **Domain & trademark for "Stoop".** Verify before Month 2 marketing spend.
4. **NICE employment legal review.** Founder's read is non-competing; no counsel confirmation.
5. **Pricing tier typo.** User-supplied tiers were "up to 50, 50–100, above 50" — assumed 1–50 / 51–100 / 100+.
6. **Path vs subdomain routing.** Path-based is cheaper to ship; affects branding and shareable links.

---

## 11. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Madison Park migration data loss | High | Full DB dump before; staged rollout; see migration doc. |
| 2 | NICE dispute over IP / non-compete | Med-High | Founder believes non-competing; **recommend ~$500 employment-counsel review before first paying tenant**. |
| 3 | Resend free tier insufficient | Medium | ~10–50 emails/HOA/month → ~30 active tenants before constraint. Move to paid before. |
| 4 | "Stoop" trademark collision | Medium | Search before public launch. |
| 5 | Self-managed HOAs are price-sensitive (volunteers paying out of dues) | Medium | Tiered pricing; small tier should be a no-brainer ($X TBD). |
| 6 | 3-month tenant-2 timeline tight given migration scope | Medium | Migration plan is ~8 working days; remaining 10 weeks for polish + sales. |
| 7 | Bottom-up adoption fails — no board member discovers the product | High | Backstop with targeted outbound to GA HOA boards. If no traction by Month 4, revisit ICP. |
| 8 | Property-management tier in pricing creates ICP confusion | Low | Defer to v1.5; remove from public pricing until then. |

---

## 12. How Claude Code uses this document

- Read at the start of every session (the root `CLAUDE.md` enforces this).
- Update when a decision changes — don't let the doc rot.
- When making implementation decisions, check this doc first; if a section says "TBD" or "open," ask the founder before deciding.
- The technical companion is [`MULTI_TENANCY_MIGRATION.md`](./MULTI_TENANCY_MIGRATION.md).
