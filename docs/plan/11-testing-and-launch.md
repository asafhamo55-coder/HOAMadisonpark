# 11 — Testing & Launch

The "are we ready" gates before any of this goes live.

---

## Test pyramid

```
            ┌────────────┐
            │  E2E (Playwright)
            │  ~30 critical paths
            └────────────┘
        ┌─────────────────────┐
        │  Integration tests
        │  (Vitest + Supabase test instance)
        │  ~150 tests
        └─────────────────────┘
   ┌───────────────────────────────┐
   │  Unit tests (Vitest)
   │  ~500+ tests
   └───────────────────────────────┘
```

---

## Tenant-isolation tests (CRITICAL)

These are the tests that, if they pass, you can sleep at night.

### 1. RLS isolation

```ts
// tests/isolation.test.ts
test('Tenant A cannot read Tenant B data via direct query', async () => {
  const { tenantA, tenantB, userA } = await seedTwoTenants()
  const supaA = createClient(SUPABASE_URL, ANON_KEY, { auth: { storageKey: 'a' }})
  await supaA.auth.signInWithPassword({ email: userA.email, password: 'test' })
  await supaA.rpc('set_request_tenant', { t: tenantA.id })

  const { data } = await supaA.from('properties').select('*').eq('tenant_id', tenantB.id)
  expect(data).toEqual([])  // RLS clamps even though we asked for B
})

test('Tenant A cannot read Tenant B data via no filter', async () => { /* similar */ })
test('Tenant A cannot insert into Tenant B', async () => { /* similar */ })
test('Tenant A cannot update Tenant B', async () => { /* similar */ })
test('Storage: Tenant A cannot read Tenant B objects', async () => { /* similar */ })
test('Tenant A admin cannot impersonate Tenant B', async () => { /* similar */ })
```

Add a fuzz/property-style test that creates 5 tenants, performs 1000 random reads/writes, and asserts no row crosses tenants.

### 2. Role enforcement

```ts
test('Resident cannot access /[slug]/violations admin route', async () => { /* … */ })
test('Resident cannot create a violation via API', async () => { /* … */ })
test('Vendor sees only assigned jobs', async () => { /* … */ })
```

### 3. Plan limit enforcement

```ts
test('Starter plan blocks 51st property creation', async () => { /* … */ })
test('Email cap blocks letter send when over limit', async () => { /* … */ })
test('Add-on lifts the cap', async () => { /* … */ })
```

---

## E2E paths (Playwright)

The 30 critical paths:

1. New visitor → home → pricing → signup → email confirm → onboarding step 1
2. Onboarding all 7 steps with sample data → land on dashboard
3. Onboarding with CSV import (1000 rows) → import succeeds
4. Onboarding with PDF governing doc → KB populated
5. Trial → upgrade to Starter via Stripe checkout
6. Plan change Starter → Standard mid-cycle (proration verified)
7. Cancel subscription → still active → access ends after period
8. Past-due → payment retry succeeds → restored
9. Login (multi-tenant user) → tenant picker → workspace
10. Invite member by email → accept invite → membership active
11. Create property → add resident → resident gets portal invite
12. Resident logs in to portal → sees only own property data
13. Create violation with photos → AI summary generated → letter drafted → letter sent → resident receives email
14. Vendor portal: vendor logs in → sees assigned job → marks complete
15. Bulk import properties via CSV
16. Generate Q2 dues for all properties → record one payment → record waiver
17. Send announcement to all residents → email delivered
18. Edit letter template → version saved → preview correct
19. Change branding color → reload dashboard → color applied
20. Upload governing doc → AI extraction → review → publish to KB
21. AI Q&A: resident asks fence question → cited answer
22. ARC request submitted → reviewed → approved → emailed
23. Maintenance request submitted → assigned to vendor → resolved
24. Settings → audit log → search → export
25. Export tenant data (full) → ZIP downloaded
26. Platform console: Asaf logs in → sees all tenants → impersonates one → exits
27. Platform broadcast email → received by all tenant owners
28. Stripe webhook replay → idempotent (no duplicate state)
29. Forgot password → reset → login
30. Custom domain (v2) — skip for MVP

Run nightly in CI against a staging Supabase + Stripe test mode.

---

## Performance tests

- k6 load test: 100 concurrent users on `/madison-park` dashboard for 5 min, p95 < 1s
- DB stress: 10K properties in a single tenant, list view < 800ms
- Bulk import: 5K-row CSV in < 60s
- Letter PDF generation: 10 in parallel, all complete < 10s

---

## Security review

Before paid launch:

- [ ] OWASP Top 10 walkthrough
- [ ] Secret scan in repo (gitleaks)
- [ ] CSRF protection verified on all server actions
- [ ] Rate limiting on signup, login, password reset, AI endpoints
- [ ] Stripe webhook signature verification (no naked endpoint)
- [ ] CSP headers configured
- [ ] Cookie flags: HttpOnly, Secure, SameSite=Lax
- [ ] All emails rendered with sanitized merge data (no XSS via resident name with `<script>`)
- [ ] File upload mime/size validation
- [ ] PII fields encrypted at rest where required (Supabase Vault for SSNs if any)
- [ ] Pen test by an external party before public launch (post-pilot)

---

## Compliance posture (MVP — not certified, but ready)

- [ ] Terms of Service drafted (use a reputable template like Termly, then lawyer review)
- [ ] Privacy Policy drafted (GDPR + CCPA + Georgia / state-specific clauses)
- [ ] DPA template available for Enterprise tier
- [ ] Cookie banner (analytics-only, since auth uses essential cookies)
- [ ] Email unsubscribe links per CAN-SPAM
- [ ] Data export endpoint per GDPR Art. 20
- [ ] Data deletion endpoint per GDPR Art. 17 / CCPA
- [ ] Subprocessor list published (Supabase, Vercel, Stripe, Resend, Anthropic, OpenAI)
- [ ] Status page (use BetterStack or Statuspage.io free tier)

---

## Launch sequence

### Week -2: Internal alpha
- Asaf only
- Madison Park migrated to multi-tenant on a parallel deployment
- Daily smoke-test for one week, log any drift
- Fix everything found

### Week -1: Closed beta
- 1 friendly second tenant (an HOA you can hand-hold)
- They go through full onboarding live with you on screen-share
- Feedback collected daily
- Final fixes

### Week 0: Public launch (soft)
- Marketing site live
- Pricing page live
- Self-serve signup live with trial
- Limited paid promotion (LinkedIn post, HOA forums, your network)
- 5 paying tenants is the target Month 1

### Week 1+: Iterate
- Daily review of: signups, conversion, support tickets, error logs
- Weekly product review with any beta tenants
- Monthly roadmap review

---

## Runbooks (build before launch)

- [ ] **Incident response** — who to page, where to post, how to roll back
- [ ] **Stripe webhook failure** — what to do when webhooks lag
- [ ] **Supabase outage** — comms template, status page update
- [ ] **Failed migration** — rollback procedure
- [ ] **Tenant data export request** — manual steps until automated
- [ ] **Tenant deletion request** — verify identity, soft-delete, schedule hard-delete
- [ ] **AI cost spike** — kill switch, identify offending tenant, throttle
- [ ] **Email sender reputation** — what to do if Resend flags us, how to authenticate new tenant domains

---

## Final go/no-go checklist (Day -1)

- [ ] All Stream A–H validation checklists green
- [ ] Madison Park running smoothly on multi-tenant for 7+ days with no support tickets
- [ ] Stripe in live mode, webhooks delivering, test charge succeeds
- [ ] Resend in production with DKIM/SPF/DMARC verified for `hoahub.app`
- [ ] Supabase production project on Pro tier, point-in-time recovery enabled
- [ ] Vercel production deployment with preview environments
- [ ] Sentry / PostHog wired
- [ ] Status page live
- [ ] Legal pages live and reviewed
- [ ] DNS for marketing + app domain set
- [ ] SSL valid
- [ ] First three tenant onboarding test runs successful end-to-end
- [ ] Asaf has a written cancellation/refund policy
- [ ] Backup tested by restore (don't trust untested backups)
