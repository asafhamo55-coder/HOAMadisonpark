# Stream H — New SaaS Features
**Agent:** `feature-agent`
**Depends on:** Stream A, Stream G
**Goal:** The features that make HOA Hub *more* than "Madison Park's app for everyone." These are the differentiators and growth drivers.

This stream is large and prioritized — implement in the listed order, gated by feature flag so each can ship independently.

---

## Feature catalog (priority order)

### H1 — AI Document Q&A *(Pro plan)*
A search box on the dashboard: "Ask your covenants…". Resident types "Can I install a 6-foot wood fence?" → answer with citations to the actual document.

**Implementation:**
- Knowledge base from Stream E provides chunked, embedded sections (`tenant_knowledge_base`)
- Query embeds via OpenAI/Voyage embeddings → pgvector similarity search → top-K chunks
- Send to Claude API with strict prompt: "Answer only from the provided sections. Cite section path and page number. If unsure, say so."
- Cache results per tenant + question for 24 hours

**Permission:** all roles. Residents see resident-relevant sections only (filter chunks by `resident_visible=true`).

**Cost control:** AI credits deducted per call (1 credit = 1 query). Pro plan includes 500/mo. Add-on packs for more.

### H2 — AI Violation Drafter *(Pro plan)*
Upload photos + select category → Claude drafts the violation notice referencing the exact governing-document section. Already prototyped in your existing app — productize it.

**Flow:**
1. Admin uploads 1–4 photos
2. Vision-capable Claude inspects each, generates a description
3. Admin picks category and severity
4. System pulls the relevant covenant section from the KB
5. Claude drafts the letter with merge fields filled, citations included, deadline computed from tenant settings
6. Admin reviews, edits, sends

### H3 — Scheduled fines & escalation *(Standard plan)*
Tenant configures: "If violation not cured by deadline, escalate to next tier automatically."

- State machine on each violation: courtesy → 1st notice → 2nd notice → fine → hearing
- Cron job nightly checks deadlines, advances state, sends next letter
- Escalation rules per category (some require board review, some auto)
- Audit trail of every transition

### H4 — Voting & elections *(Pro plan)*
Many HOAs run annual elections by paper ballot. Bring it online.

- Admin creates a "ballot" with eligible voters (filter by Owner type), candidates/options, voting window
- Each eligible voter gets a unique magic link (token) to a voting page
- Anonymous tally + audit log of who voted (not what they voted)
- Quorum tracking, proxy support, tie-breaking rules per tenant
- Real-time results dashboard for the board (locked until window closes)

### H5 — Financial management *(Standard+)*
Beyond payments: monthly P&L, budget vs. actual, vendor invoice tracking, reserve fund tracker.

- Chart of accounts (pre-seeded for HOAs)
- Vendor invoice intake (email forwarding, OCR via Claude vision)
- QuickBooks Online sync (Pro)
- Reserve study upload & projection chart
- Monthly close workflow

### H6 — Communications *(all plans)*
Multi-channel announcements: email + SMS + push (PWA) + in-app.

- Compose once, choose channels
- SMS via Twilio (paid add-on, $X/segment)
- PWA push notifications (free, requires user enable)
- Two-way SMS for resident questions, routed to support inbox

### H7 — Mobile (PWA → Capacitor)
- Step 1: convert existing web app to PWA (already documented in your prior work)
- Step 2: wrap with Capacitor for App Store presence
- Native push notifications for letters received, payment due, announcements

### H8 — Maintenance request marketplace *(Pro+)*
- Residents submit requests
- Board assigns to vendor (or vendor self-claims)
- Vendor portal: schedule, photos, complete, invoice
- Optional: hub-curated vendor directory (revenue share or referral fee)

### H9 — Public community page *(all plans)*
Each tenant gets `hoahub.app/c/[slug]/public` with:
- Community profile (photos, amenities, location)
- Public announcements
- Real estate / new homeowner interest form
- Documents marked "public"
- "Request access" / "Join" CTA for new residents

### H10 — Open API *(Pro plan)*
- Personal access tokens scoped per tenant
- REST endpoints for properties, residents, violations, letters, payments
- Webhooks for events (violation.created, letter.sent, payment.received)
- Useful for integration with property management software, accounting, CRMs

### H11 — Vendor portal *(Standard+)*
Already partially designed. Vendors get a slim portal showing only their assigned jobs.

### H12 — Insurance & document expiration tracking *(Standard+)*
Track vendor COIs, association D&O policy, contractor licenses, with auto-reminders 30/60/90 days before expiry.

### H13 — Architectural review committee (ARC) module *(Standard+)*
- Resident submits ARC request with photos, drawings, materials list
- ARC committee members vote
- Conditional approval workflows
- Integration with violations (post-approval, mismatch becomes a violation)

### H14 — Multi-language *(Pro+)*
Spanish first, then Hebrew (Asaf's communities), then Mandarin.
- i18n via `next-intl`
- Tenant chooses default language; residents can override per-account
- AI letter drafting respects language

### H15 — Smart home & gate integration *(Enterprise)*
- Visitor codes, package room, gate access logs
- Integration with common providers (DoorKing, ButterflyMX, Latch)

---

## Cross-cutting feature concerns

### Feature flags

Every feature wired through `tenant_features` table + `useFeature('ai_doc_qa')` hook. Flags can be:
- Plan-gated (auto on/off based on plan)
- Tenant-overridden (Asaf grants beta access)
- Globally killed (kill switch for incidents)

### Telemetry

Every new feature emits PostHog events with `tenant_id`, `user_id`, `feature_key`, `outcome`. Used for:
- Adoption dashboards in Platform Console
- Trial conversion correlation (which features trial users touch most)
- Feature deprecation decisions

### AI cost management

All AI calls go through `lib/ai.ts` which:
- Routes to the right model (Claude Haiku for cheap tasks, Sonnet for complex, Opus for hardest)
- Logs token usage to `usage_events` with metric `ai_tokens`
- Decrements `ai_credits` from tenant balance
- Caches aggressively (key by tenant + prompt hash + KB version)

---

## Validation checklist (per-feature, abbreviated)

For each feature shipping, confirm:
- [ ] Behind a feature flag, defaults to OFF
- [ ] Plan-gated (correct tier required)
- [ ] Cap-enforced (AI credits, emails, SMS)
- [ ] PostHog telemetry events firing
- [ ] Documented in `/help` portal
- [ ] Smoke-tested by a non-admin and an admin
- [ ] Audit-logged where appropriate
- [ ] Mobile-friendly

---

## Open questions for Asaf

1. Which features are "must-have v1" vs. "nice-to-have v2"? *(My recommendation: v1 = H1, H2, H3, H6 PWA-only, H13. v2 = H4, H5, H7 Capacitor, H8.)*
2. SMS pricing — pass-through cost to tenants ($0.01/segment markup) or include in Pro plan up to a cap?
3. AI cost caps — what's your monthly AI budget per Pro tenant before you'd want to throttle?
4. Public community pages — opt-in only, or default-on with the option to hide?
