# Stream D — Billing & Subscriptions (Stripe)
**Agent:** `billing-agent`
**Depends on:** Stream A
**Goal:** Trustworthy SaaS billing — trials, plan changes, dunning, invoices, usage caps, all without writing custom payment logic.

---

## Deliverables

1. Stripe integration (checkout, portal, webhooks)
2. Plans configured in Stripe + mirrored in `plans` table
3. Trial → paid conversion flow
4. Usage tracking and cap enforcement (properties, emails, AI credits)
5. Invoice history and downloadable PDFs
6. Billing portal embedded in tenant settings
7. Dunning + automatic suspension when subscription lapses
8. Tax handling (Stripe Tax)

---

## Database

```sql
create table plans (
  id                text primary key,            -- 'starter', 'standard', 'pro', 'enterprise'
  name              text not null,
  description       text,
  stripe_product_id text,
  stripe_price_monthly text,
  stripe_price_annual  text,
  monthly_cents     int,
  annual_cents      int,
  property_cap      int,                          -- null = unlimited
  seat_cap          int,                          -- null = unlimited
  email_cap_monthly int,
  ai_credits_monthly int default 0,
  features          jsonb,                        -- feature flags
  is_public         boolean default true,
  sort_order        int
);

create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants on delete cascade,
  stripe_customer_id       text not null,
  stripe_subscription_id   text unique,
  plan_id                  text references plans,
  status                   text,                  -- mirrors Stripe status
  billing_cycle            text check (billing_cycle in ('monthly','annual')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean default false,
  trial_ends_at            timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create table invoices (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants,
  stripe_invoice_id        text unique,
  number                   text,
  amount_due_cents         int,
  amount_paid_cents        int,
  currency                 text default 'usd',
  status                   text,                  -- 'paid','open','past_due','void'
  hosted_invoice_url       text,
  invoice_pdf              text,
  period_start             timestamptz,
  period_end               timestamptz,
  created_at               timestamptz default now()
);

create table usage_events (
  id          bigserial primary key,
  tenant_id   uuid not null references tenants,
  metric      text not null,                       -- 'email_sent', 'ai_extraction', 'sms_sent'
  quantity    int not null default 1,
  metadata    jsonb,
  created_at  timestamptz default now()
);
create index on usage_events(tenant_id, metric, created_at);

create table addons (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants,
  type        text,                                 -- 'extra_emails', 'extra_properties', 'white_label'
  qty         int default 1,
  stripe_subscription_item_id text,
  active      boolean default true,
  created_at  timestamptz default now()
);
```

Seed `plans` with the 4 tiers from the master plan.

---

## Stripe setup

1. **Products** — one per plan in Stripe Dashboard (Starter, Standard, Pro)
2. **Prices** — two per plan: monthly and annual. Use `lookup_key` like `starter_monthly`, `starter_annual` for stable code references.
3. **Tax** — enable Stripe Tax, configure US states, set tax behavior to "exclusive" (price is pre-tax)
4. **Customer portal** — enable update payment, cancel, change plan, view invoices
5. **Webhooks** — point to `/api/stripe/webhook`, subscribe to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

---

## Flows

### Sign up for paid plan from `/pricing`

`/pricing` → "Choose Starter" → if not logged in, route to `/signup?plan=starter`. Trial users go through onboarding first; they enter billing only when they hit a cap or trial ends or click "Upgrade now".

### Trial → paid conversion

When user clicks "Upgrade" inside their tenant:
1. Server action creates a Stripe Checkout Session with the chosen price
2. Customer email = tenant primary owner email
3. Metadata: `tenant_id`, `plan_id`, `billing_cycle`
4. Success URL: `/[slug]/settings/billing?success=1`
5. Cancel URL: `/[slug]/settings/billing?cancelled=1`
6. Webhook on `subscription.created` writes the row to `subscriptions`, sets tenant `status='active'`, sets `plan_id`

### Plan change

- Same checkout session pattern, but use the Customer Portal flow `/api/stripe/portal` for self-serve plan changes
- Stripe handles proration automatically
- Webhook on `subscription.updated` mirrors changes to our DB

### Cancellation

- "Cancel subscription" in Customer Portal sets `cancel_at_period_end=true`
- We do NOT immediately suspend — they keep access until period end
- Webhook on `subscription.deleted` (after the period) sets tenant `status='cancelled'`
- Tenant data is retained for 30 days post-cancellation for export, then soft-deleted (audit retained for 7 years)

### Failed payment / dunning

- Stripe handles retry schedule (3 attempts over 14 days)
- On `invoice.payment_failed`: notify tenant owner via email + dashboard banner
- After final failure: tenant `status='past_due'`, app shows "Payment required" wall but read-only access to data and exports

### Trial expiry

- Cron job checks `trial_ends_at < now()` and `subscriptions.status != 'active'` daily
- 3 days before expiry: warning email + banner
- 1 day before expiry: warning email + banner
- Day of expiry: tenant `status='past_due'`, lock writes (read-only)
- 30 days after expiry with no upgrade: tenant `status='cancelled'`

---

## Usage caps & enforcement

For each metric (properties, seats, emails, AI), enforce caps in two places:

1. **Pre-action check** — before insert, count current usage and reject if over cap (with a clear "Upgrade or buy add-on" CTA)
2. **Post-action telemetry** — log every chargeable action to `usage_events` for billing reports

Helpers in `lib/limits.ts`:

```ts
export async function assertWithinLimit(
  tenantId: string,
  metric: 'properties' | 'seats' | 'emails_monthly' | 'ai_extractions_monthly',
  delta = 1
): Promise<void> { /* … */ }
```

Use in every relevant server action:

```ts
// before creating a property
await assertWithinLimit(tenantId, 'properties', 1)
```

---

## Billing UI inside the tenant

`/[slug]/settings/billing`:

- Current plan card (plan name, status, amount, next billing date)
- "Manage billing" button → Stripe Customer Portal
- Usage panel with progress bars: properties X/Y, emails X/Y this month, AI credits X/Y
- "Upgrade plan" comparison table
- Invoice history (last 12) with download links
- Add-ons management (extra emails, extra properties)

---

## Webhook handler skeleton

```ts
// app/api/stripe/webhook/route.ts
import Stripe from 'stripe'
import { adminClient } from '@/lib/admin'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object)
      break
    case 'customer.subscription.deleted':
      await markCancelled(event.data.object)
      break
    case 'invoice.paid':
      await recordInvoice(event.data.object, 'paid')
      break
    case 'invoice.payment_failed':
      await recordInvoice(event.data.object, 'past_due')
      await notifyDunning(event.data.object)
      break
    case 'customer.subscription.trial_will_end':
      await notifyTrialEnding(event.data.object)
      break
  }
  return new Response('ok')
}
```

All handlers must be idempotent (key by `stripe_subscription_id` / `stripe_invoice_id`).

---

## Tax & compliance notes

- Use Stripe Tax for automatic US sales tax calculation
- Annual plans: Stripe handles proration on plan change
- Save the customer's billing address with the Stripe customer
- Generate W-9 receipts on demand for community treasurers (some HOAs are nonprofits and need clean records)

---

## Validation checklist

- [ ] Sign up for trial → see `/[slug]/settings/billing` showing "Trial · 14 days remaining"
- [ ] Upgrade to Starter via Checkout → webhook updates DB → tenant status `active`, plan `starter`
- [ ] Trial ending banner appears at 3 days, 1 day, 0 days
- [ ] Hitting properties cap shows upgrade CTA (verified by setting cap=2 and creating 3 properties)
- [ ] Cancel subscription → still active until period end → cancelled after webhook
- [ ] Failed payment → past_due banner + email
- [ ] Customer Portal launches with correct return URL and pre-filled customer
- [ ] All webhook handlers are idempotent (replay test passes)
- [ ] Stripe Test mode end-to-end run logged with screenshots
- [ ] No Stripe secret keys in client bundle (verified via `npm run build && grep`)

---

## Open questions for Asaf

1. Stripe account ownership — your personal vs. a new entity? Recommend forming an LLC before launch for liability separation.
2. Tax handling — enable Stripe Tax (5 min setup) or invoice manually for early tenants?
3. Annual discount mechanics — 17% off vs. "2 months free"?
4. Does the resident portal count toward the seat cap or is it unlimited residents? *(Strong recommendation: residents are unlimited; only admin/board/committee count toward seats.)*
