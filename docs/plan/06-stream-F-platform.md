# Stream F — Platform Super-Admin Console
**Agent:** `platform-agent`
**Depends on:** Stream A, Stream D
**Goal:** A console for Asaf (and future support staff) to operate the platform: see every tenant, every subscription, every invoice, every support ticket, every error, every churn signal.

---

## Deliverables

1. `/platform/*` routes locked to platform-admin role (separate from tenant roles)
2. Tenant directory with full CRUD
3. Subscription & revenue dashboard
4. Usage & health monitoring
5. Support inbox + impersonation (with audit)
6. Email & comms tools (announcements to all tenants)
7. Plan & feature flag editor
8. Logs & audit viewer

---

## Access control

```sql
create table platform_admins (
  user_id     uuid primary key references auth.users,
  role        text check (role in ('owner','support','readonly')) default 'support',
  created_at  timestamptz default now()
);

create or replace function is_platform_admin()
returns boolean language sql stable as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;
```

Middleware: any `/platform/*` request requires `is_platform_admin()` true. Otherwise 404 (not 403 — don't reveal the route exists).

Bootstrap with Asaf as the first row, `role='owner'`.

---

## Pages

### `/platform` — Home dashboard

Top metrics row:
- MRR (with sparkline last 12 months)
- ARR
- Active tenants (by status: trial, active, past_due)
- New trials this week / month
- Trial → paid conversion rate (last 30 days)
- Net revenue retention (NRR)
- Churn rate (logo + revenue)

Charts:
- MRR over time (stacked by plan)
- New tenants per week (bar)
- Active vs. churned tenants (cohort chart)
- Top 10 tenants by usage / revenue

Activity feed:
- New signups, plan changes, cancellations, support tickets

### `/platform/tenants` — Tenant directory

Searchable, filterable table:
- Columns: name, slug, plan, status, MRR, properties, residents, last activity, signup date
- Filters: status, plan, state, signup date range
- Bulk actions: send broadcast email, export, suspend
- Row click → `/platform/tenants/[id]`

### `/platform/tenants/[id]` — Tenant detail

Tabs:
- **Overview** — community profile, owner, status, plan, trial/billing dates, key stats
- **Subscription** — current plan, next invoice, history, "Change plan" override, "Apply credit"
- **Usage** — properties, residents, emails sent, AI extractions, storage MB, login activity
- **Members** — list of all users in the tenant with roles, last login, "Resend invite", "Disable"
- **Activity** — full audit log feed
- **Support** — open tickets, notes, attachments
- **Impersonate** — "View as this tenant" launches a special session that shows the tenant's app with a red banner reading "Impersonating <name> as <Asaf>" — every action audit-logged

### `/platform/subscriptions` — Subscription ops

- All Stripe customers/subscriptions in a single table
- Filter by status (active, past_due, cancelled, trialing)
- Click into Stripe-side actions: refund, apply credit, pause, force-renew

### `/platform/invoices` — Invoice browser

- All invoices across all tenants
- Search by invoice #, tenant, amount, status
- Bulk PDF download

### `/platform/plans` — Plan editor

- Edit prices, caps, features per plan
- Toggle public / hidden plans (e.g., a grandfathered "$29 Starter" for legacy customers)
- Editing a plan updates Stripe via API where possible (price changes spawn new prices to maintain history)

### `/platform/flags` — Feature flags

- Per-feature toggles per tenant: `ai_doc_qa`, `voting`, `sms`, `custom_domain`
- Useful for early access / beta features
- All flag reads are cached at the tenant level

### `/platform/broadcasts` — Mass email

- Send announcement to all tenant owners (release notes, downtime notice, policy updates)
- Compose with merge fields, preview, send-test, schedule
- Tracked open/click rates

### `/platform/support` — Inbox

- Inbound from `support@hoahub.app` (Resend inbound parsing)
- Each thread linked to a tenant if sender matches a known user
- Reply directly from console (Resend outbound)
- Status: open / waiting / resolved / closed
- Internal notes (not sent to tenant)

### `/platform/audit` — Audit log

- Combined view of `audit_log` (per-tenant) and `platform_audit_log` (Asaf actions)
- Filter by actor, action, tenant, date range
- Export to CSV

### `/platform/health` — System health

- Supabase metrics (connections, queue depth, replication lag)
- Stripe webhook delivery status
- Resend bounce/complaint rate
- Background job queue depth and failures
- Slowest queries (read from Supabase pg_stat_statements)

---

## Impersonation — done safely

Critical security feature. Implementation:

1. Asaf clicks "Impersonate" on a tenant
2. Server creates a short-lived (15 min) impersonation session token, recorded in `impersonation_sessions`
3. Browser is redirected to `/[slug]/?_imp=<token>`
4. Middleware detects the token, validates it's owned by Asaf, sets `x-impersonator-id` header alongside `x-tenant-id`
5. UI renders a sticky red banner: "👤 Impersonating <tenant name> — exit"
6. Every action that flows through `lib/audit.ts` records BOTH the actor and the impersonator
7. Sensitive actions (delete, payment, send-letter, modify-billing) are BLOCKED during impersonation — read-only / safe-actions only by default
8. Exit returns Asaf to `/platform/tenants/[id]`

```sql
create table impersonation_sessions (
  id              uuid primary key default gen_random_uuid(),
  impersonator_id uuid not null references auth.users,
  tenant_id       uuid not null references tenants,
  token           text unique not null,
  reason          text not null,                  -- required field
  expires_at      timestamptz default (now() + interval '15 minutes'),
  ended_at        timestamptz,
  created_at      timestamptz default now()
);
```

---

## Reporting & exports

Every list page has CSV export. Revenue dashboard exports to Excel via the xlsx skill.

Scheduled reports (configurable):
- Daily: new signups, cancellations, support tickets opened
- Weekly: MRR delta, top usage tenants, churn list
- Monthly: full revenue P&L summary

Sent to Asaf's email by default.

---

## Validation checklist

- [ ] Non-platform-admin user gets 404 on `/platform`
- [ ] Tenant directory loads in < 2s with 100+ tenants
- [ ] Impersonation banner is sticky and obvious
- [ ] Impersonation cannot perform destructive actions (verified in red-team test)
- [ ] Every impersonated action is recorded with both actor and impersonator
- [ ] MRR calculation matches Stripe MRR within $1 (tolerance for proration timing)
- [ ] Broadcast email respects unsubscribes (per-recipient `tenant_owner_unsubscribed=true`)

---

## Open questions for Asaf

1. Who else gets platform admin access in v1? Recommend: just Asaf (owner), then add support roles only when first hire.
2. Impersonation — do you want a "with permission" mode where the tenant has to grant access, or always-on for owners?
3. Internal Slack alerts — wire support inbox + critical errors to a Slack channel? *(Recommend yes, channel `#hoahub-ops`.)*
