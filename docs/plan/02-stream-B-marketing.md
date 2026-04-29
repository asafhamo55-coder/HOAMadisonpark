# Stream B — Marketing Site, Pricing, Signup
**Agent:** `marketing-agent`
**Depends on:** Stream A
**Goal:** A polished public-facing site that converts visitors into trial sign-ups, plus a transparent pricing page and a frictionless signup flow.

---

## Deliverables

1. `/` — Hero + value prop + social proof + features + CTA
2. `/pricing` — Plan comparison table with monthly/annual toggle
3. `/features/*` — Deep dives on key feature areas
4. `/about`, `/contact`, `/legal/{terms,privacy,dpa}`
5. `/demo` — Interactive product tour (clickable screenshots, no auth)
6. `/signup` — Plan selection + email + password + tenant info → creates auth user + redirects to `/onboarding`
7. `/login` — Login + multi-tenant select
8. SEO: sitemap, robots.txt, Open Graph, structured data

---

## Page-by-page spec

### Home `/`

Sections in order:

1. **Hero** — Headline: "Run your community like it's run by professionals." Subhead: "HOA Hub is the all-in-one platform for HOAs, condo associations, and master-planned communities. Properties, violations, letters, payments, and resident self-service — in one place." CTA: "Start free 14-day trial" + "See live demo".
2. **Logo strip** — Communities using the platform (start with Madison Park; add as pilots sign up).
3. **Pain → solution** — Three columns: "Spreadsheets and Word docs", "Disconnected vendors and email chains", "Frustrated residents". Each maps to a Hub feature.
4. **Feature highlights** — 6 tiles: Property & resident records, Violation management, Automated letters with templates, Payments & dues tracking, Resident portal, Document knowledge base. Each links to `/features/...`.
5. **AI section** — "Your covenants, queryable." Show a demo of asking "Can I install a fence?" and getting a cited answer from the governing docs.
6. **Pricing teaser** — Three cards (Starter / Standard / Pro) with link to full `/pricing`.
7. **Testimonial** — Asaf quote from Madison Park (or board member quote when available).
8. **FAQ** — 6–8 common questions: data security, migration help, billing, cancellation, multi-community, white-labeling.
9. **Final CTA** — Repeat trial signup.
10. **Footer** — Product / Company / Legal / Status.

### Pricing `/pricing`

- Toggle: Monthly / Annual (annual = 2 months free, displayed as "save 17%")
- 4 columns: Trial / Starter / Standard / Pro (Enterprise = "Talk to us")
- Each plan shows: price, properties cap, seat cap, key features, primary CTA
- Below the table: feature comparison matrix (full grid)
- Section: "Add-ons" — extra properties, extra emails, AI credit packs, custom domain, white-label
- FAQ specific to billing: trial card requirement (no), what happens when you exceed cap, refunds, contract length

### Signup `/signup?plan=starter`

Steps in a single page (no full reload):

1. **Choose your plan** (or pre-selected via query param)
2. **Account** — full name, email, password, accept ToS/Privacy
3. **Community basics** — community name, type (HOA/COA/etc), state, # of properties (estimate), how-did-you-hear
4. Submit → creates `auth.users`, sends magic confirmation email, redirects to `/onboarding`

The actual tenant row is created at the end of onboarding (Stream C), not here, so a half-finished signup doesn't pollute the tenant list.

### Login `/login`

- Email + password OR magic link OR Google OAuth
- After auth: if user has 1 active membership → redirect to `/[slug]`. If multiple → `/select-tenant` picker. If zero → `/onboarding`.

---

## Tech notes

- All marketing pages are server components, statically generated where possible (`export const dynamic = 'force-static'`). Use ISR for the testimonial / customer list.
- Use `next/image` for everything. Compress hero imagery aggressively.
- Lighthouse ≥ 95 on all four scores for `/`, `/pricing`, `/signup`.
- Analytics: PostHog (events), Plausible (pageviews) — no Google Analytics.
- A/B testing harness on hero headline + primary CTA.

---

## Component & visual spec

Use the design system from `10-design-system.md`. Key details:
- Primary brand color: deep navy `#0F2A47` (Madison-Park-friendly, but tenant-overridable)
- Accent: emerald `#10B981`
- Typography: Inter for body, Fraunces for marketing headlines (only on marketing routes)
- Subtle gradient meshes on hero, no stock photography of "happy diverse people pointing at laptops"
- Real product screenshots, dimmed and overlaid with feature callouts

---

## Copy seeds (Asaf can edit)

**Home headline options** (pick one to start, A/B test the others):
1. "Run your community like it's run by professionals."
2. "The operating system for residential communities."
3. "Stop managing your HOA in spreadsheets."

**Trial CTA microcopy:** "14 days free. No credit card. Cancel anytime."

**FAQ — Is my data safe?**
"Your data lives in your own isolated tenant inside our SOC 2-aligned Postgres database, protected by row-level security. We never share data between communities. You can export everything to CSV or PDF at any time, and you own it."

---

## Validation checklist

- [ ] All 8 pages load with no console errors
- [ ] `/pricing` toggle correctly switches monthly/annual values
- [ ] Signup creates only an `auth.users` row, not a tenant row
- [ ] Email confirmation lands user on `/onboarding`
- [ ] `/login` redirects correctly based on membership count
- [ ] Lighthouse ≥ 95 on home, pricing, signup
- [ ] Sitemap and robots.txt valid
- [ ] Open Graph cards render correctly when shared on Slack and LinkedIn
- [ ] Mobile layout passes manual review on iPhone 14 + Pixel 8

---

## Open questions for Asaf

1. Brand name confirmation — `HOA Hub` vs `Communiti` vs `Coveni` vs your preference. (Reserve domain & GitHub org accordingly.)
2. Pricing — comfortable with $49 / $129 / $299? Or start higher to avoid race-to-the-bottom positioning?
3. Annual discount — 2 months free, or a flat 15%, or 17%?
4. Should we display the customer logo strip even with just Madison Park, or wait for 3+ tenants?
