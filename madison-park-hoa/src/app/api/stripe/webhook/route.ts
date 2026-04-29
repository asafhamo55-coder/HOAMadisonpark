/**
 * Stripe webhook handler.
 *
 * Receives subscription + invoice lifecycle events from Stripe and mirrors
 * them into our `subscriptions` and `invoices` tables. All writes go through
 * `withAdminClient` so they show up in `platform_audit_log` (the webhook is
 * one of the documented service-role-allowed callsites in `lib/admin.ts`).
 *
 * Handlers are idempotent — keyed on `stripe_subscription_id` /
 * `stripe_invoice_id` (both UNIQUE in the schema). Replaying the same event
 * id is a no-op aside from a no-effect upsert + an extra audit row.
 *
 * Signature verification with `stripe.webhooks.constructEvent` is mandatory:
 * an unsigned or wrongly-signed payload returns 400 BEFORE any DB write.
 *
 * Subscribed events (configure in Stripe dashboard):
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.paid
 *   - invoice.payment_failed
 *   - customer.subscription.trial_will_end
 *
 * NOTE: Next.js App Router auto-buffers the request body, but Stripe needs
 * the *raw* bytes for signature verification. We use `req.text()` which
 * returns the unparsed string — no `bodyParser:false` config needed in App
 * Router (that was a Pages Router thing).
 */

import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { withAdminClient } from "@/lib/admin"
import { getStripe, getWebhookSecret } from "@/lib/stripe"

// Force the Node.js runtime — Stripe SDK uses Node crypto under the hood.
export const runtime = "nodejs"
// Disable caching — every webhook is a unique event.
export const dynamic = "force-dynamic"

type SubscriptionEventObject = Stripe.Subscription
type InvoiceEventObject = Stripe.Invoice

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json(
      { error: "missing stripe-signature header" },
      { status: 400 },
    )
  }

  let event: Stripe.Event
  let rawBody: string
  try {
    rawBody = await req.text()
    const stripe = getStripe()
    const secret = getWebhookSecret()
    // MANDATORY signature verification — DECISIONS.md & validation gate.
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[stripe.webhook] signature verification failed:", message)
    return NextResponse.json(
      { error: `webhook signature verification failed: ${message}` },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event, event.data.object as SubscriptionEventObject)
        break

      case "customer.subscription.deleted":
        await markSubscriptionCanceled(
          event,
          event.data.object as SubscriptionEventObject,
        )
        break

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event, event.data.object as SubscriptionEventObject)
        break

      case "invoice.paid":
        await recordInvoice(event, event.data.object as InvoiceEventObject, "paid")
        break

      case "invoice.payment_failed":
        await recordInvoice(
          event,
          event.data.object as InvoiceEventObject,
          "past_due",
        )
        break

      default:
        // Unknown / unsubscribed events: log + 200 so Stripe doesn't retry.
        console.log("[stripe.webhook] ignoring event type:", event.type)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[stripe.webhook] handler error for ${event.type} (${event.id}):`,
      message,
    )
    // 500 → Stripe retries with exponential backoff.
    return NextResponse.json(
      { error: `handler failed: ${message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true })
}

// ============================================================
// Helpers
// ============================================================

/**
 * Resolve the tenant id for a Stripe object. Subscriptions store it on
 * metadata when we create them via Checkout; if missing (e.g. portal-driven
 * change), fall back to a lookup by `stripe_customer_id`.
 */
async function resolveTenantId(
  metadata: Stripe.Metadata | null | undefined,
  stripeCustomerId: string | null | undefined,
): Promise<string | null> {
  const fromMeta = metadata?.tenant_id
  if (fromMeta && typeof fromMeta === "string") return fromMeta

  if (!stripeCustomerId) return null

  return withAdminClient(
    {
      action: "stripe.webhook.lookup_tenant",
      reason: "resolve tenant from stripe_customer_id",
      tenantId: null,
      metadata: { stripeCustomerId },
    },
    async (admin) => {
      const { data } = await admin
        .from("subscriptions")
        .select("tenant_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .limit(1)
        .maybeSingle()
      return data?.tenant_id ?? null
    },
  )
}

/**
 * Map a Stripe price id back to our internal plan id. Looks up either
 * `stripe_price_monthly` or `stripe_price_annual` on the `plans` table.
 */
async function resolvePlanIdAndCycle(
  priceId: string | null | undefined,
): Promise<{ planId: string | null; billingCycle: "monthly" | "annual" | null }> {
  if (!priceId) return { planId: null, billingCycle: null }

  return withAdminClient(
    {
      action: "stripe.webhook.lookup_plan",
      reason: "map stripe price id to plan",
      tenantId: null,
      metadata: { priceId },
    },
    async (admin) => {
      const { data } = await admin
        .from("plans")
        .select("id, stripe_price_monthly, stripe_price_annual")
        .or(
          `stripe_price_monthly.eq.${priceId},stripe_price_annual.eq.${priceId}`,
        )
        .limit(1)
        .maybeSingle()

      if (!data) return { planId: null, billingCycle: null }

      const billingCycle: "monthly" | "annual" | null =
        data.stripe_price_monthly === priceId
          ? "monthly"
          : data.stripe_price_annual === priceId
            ? "annual"
            : null

      return { planId: data.id, billingCycle }
    },
  )
}

/**
 * Convert a Stripe Unix timestamp (seconds) to a Postgres-friendly ISO string.
 */
function tsToIso(seconds: number | null | undefined): string | null {
  if (!seconds) return null
  return new Date(seconds * 1000).toISOString()
}

/**
 * Map a Stripe Subscription.status to our enum. Stripe's enum is a superset
 * (we accept all of its values via the CHECK constraint in migration 012).
 */
function normalizeSubStatus(s: Stripe.Subscription.Status): string {
  // All valid: trialing, active, past_due, canceled, unpaid, incomplete,
  // incomplete_expired, paused
  return s
}

// ============================================================
// Handlers
// ============================================================

async function syncSubscription(
  event: Stripe.Event,
  sub: SubscriptionEventObject,
): Promise<void> {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const tenantId = await resolveTenantId(sub.metadata, stripeCustomerId)

  if (!tenantId) {
    console.error(
      "[stripe.webhook] cannot resolve tenant for subscription",
      sub.id,
    )
    return
  }

  // Subscription items hold the price (we expect exactly one item per sub).
  const item = sub.items?.data?.[0]
  const priceId = item?.price?.id ?? null
  const { planId, billingCycle } = await resolvePlanIdAndCycle(priceId)

  // Stripe's TS types vary by API version — pull period bounds defensively.
  type SubPeriodish = SubscriptionEventObject & {
    current_period_start?: number | null
    current_period_end?: number | null
  }
  const subWithPeriod = sub as SubPeriodish
  const currentPeriodStart =
    subWithPeriod.current_period_start ??
    item?.current_period_start ??
    null
  const currentPeriodEnd =
    subWithPeriod.current_period_end ??
    item?.current_period_end ??
    null

  await withAdminClient(
    {
      action: "stripe.webhook",
      reason: event.type,
      tenantId,
      entity: "subscriptions",
      entityId: sub.id,
      metadata: {
        eventId: event.id,
        eventType: event.type,
        planId,
        status: sub.status,
      },
    },
    async (admin) => {
      // Upsert keyed on stripe_subscription_id (UNIQUE) — idempotent replay.
      const { error } = await admin
        .from("subscriptions")
        .upsert(
          {
            tenant_id: tenantId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: sub.id,
            plan_id: planId,
            status: normalizeSubStatus(sub.status),
            billing_cycle: billingCycle,
            current_period_start: tsToIso(currentPeriodStart),
            current_period_end: tsToIso(currentPeriodEnd),
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            trial_ends_at: tsToIso(sub.trial_end),
            metadata: sub.metadata ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" },
        )
      if (error) throw error

      // Mirror plan + status onto the tenant. Active → 'active', trialing →
      // keep as 'trial' (Stream A status), past_due/unpaid → 'past_due',
      // canceled → 'cancelled'.
      const tenantStatus =
        sub.status === "active"
          ? "active"
          : sub.status === "trialing"
            ? "trial"
            : sub.status === "past_due" || sub.status === "unpaid"
              ? "past_due"
              : sub.status === "canceled"
                ? "cancelled"
                : null

      const tenantPatch: Record<string, unknown> = {}
      if (planId) tenantPatch.plan_id = planId
      if (tenantStatus) tenantPatch.status = tenantStatus

      if (Object.keys(tenantPatch).length > 0) {
        const { error: tErr } = await admin
          .from("tenants")
          .update(tenantPatch)
          .eq("id", tenantId)
        if (tErr) throw tErr
      }
    },
  )
}

async function markSubscriptionCanceled(
  event: Stripe.Event,
  sub: SubscriptionEventObject,
): Promise<void> {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const tenantId = await resolveTenantId(sub.metadata, stripeCustomerId)
  if (!tenantId) return

  await withAdminClient(
    {
      action: "stripe.webhook",
      reason: event.type,
      tenantId,
      entity: "subscriptions",
      entityId: sub.id,
      metadata: { eventId: event.id, eventType: event.type },
    },
    async (admin) => {
      const { error } = await admin
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id)
      if (error) throw error

      // Tenant status → 'cancelled'. App will keep them read-only for 30
      // days (the trial-expiry cron handles eventual hard cancellation).
      await admin
        .from("tenants")
        .update({ status: "cancelled" })
        .eq("id", tenantId)
    },
  )
}

async function handleTrialWillEnd(
  event: Stripe.Event,
  sub: SubscriptionEventObject,
): Promise<void> {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const tenantId = await resolveTenantId(sub.metadata, stripeCustomerId)
  if (!tenantId) return

  // We log the event; the daily trial-expiry cron sends the actual emails.
  // Stripe fires this 3 days before trial_end, which lines up with our cron's
  // 3-day warning window.
  await withAdminClient(
    {
      action: "stripe.webhook",
      reason: event.type,
      tenantId,
      entity: "subscriptions",
      entityId: sub.id,
      metadata: {
        eventId: event.id,
        trialEndsAt: tsToIso(sub.trial_end),
      },
    },
    async () => {
      // No-op — cron sends the emails. We just want the audit row.
    },
  )
}

async function recordInvoice(
  event: Stripe.Event,
  inv: InvoiceEventObject,
  derivedStatus: "paid" | "past_due",
): Promise<void> {
  const stripeCustomerId =
    typeof inv.customer === "string"
      ? inv.customer
      : inv.customer?.id ?? null

  // Invoices may carry their own metadata (rare) but typically inherit from
  // the subscription. Try metadata first, then fall back to the customer-id
  // lookup like subscriptions do.
  const tenantId = await resolveTenantId(inv.metadata, stripeCustomerId)
  if (!tenantId) {
    console.error("[stripe.webhook] cannot resolve tenant for invoice", inv.id)
    return
  }

  // Pull subscription_id off the invoice — schema varies across Stripe API
  // versions (sometimes `subscription`, sometimes inside `parent` /
  // `subscription_details`). Fall back to scanning the line items.
  type InvoiceSubFields = InvoiceEventObject & {
    subscription?: string | Stripe.Subscription | null
    parent?: { subscription_details?: { subscription?: string | null } | null } | null
  }
  const invWithSub = inv as InvoiceSubFields
  let stripeSubscriptionId: string | null = null
  if (typeof invWithSub.subscription === "string") {
    stripeSubscriptionId = invWithSub.subscription
  } else if (invWithSub.subscription && "id" in invWithSub.subscription) {
    stripeSubscriptionId = invWithSub.subscription.id
  } else if (invWithSub.parent?.subscription_details?.subscription) {
    stripeSubscriptionId = invWithSub.parent.subscription_details.subscription
  } else {
    const lineItem = inv.lines?.data?.[0]
    type LineItemSubFields = typeof lineItem & {
      subscription?: string | null
      parent?: { subscription_item_details?: { subscription?: string | null } | null } | null
    }
    const lineItemWithSub = lineItem as LineItemSubFields | undefined
    stripeSubscriptionId =
      lineItemWithSub?.subscription ??
      lineItemWithSub?.parent?.subscription_item_details?.subscription ??
      null
  }

  await withAdminClient(
    {
      action: "stripe.webhook",
      reason: event.type,
      tenantId,
      entity: "invoices",
      entityId: inv.id ?? undefined,
      metadata: {
        eventId: event.id,
        eventType: event.type,
        derivedStatus,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
      },
    },
    async (admin) => {
      // Look up our subscription row to write the FK.
      let subscriptionRowId: string | null = null
      if (stripeSubscriptionId) {
        const { data: subRow } = await admin
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .maybeSingle()
        subscriptionRowId = subRow?.id ?? null
      }

      // Stripe statuses: paid, open, draft, uncollectible, void.
      // We additionally track 'past_due' as a derived status when the
      // invoice payment failed.
      const status =
        derivedStatus === "past_due" ? "past_due" : (inv.status ?? "open")

      const { error } = await admin
        .from("invoices")
        .upsert(
          {
            tenant_id: tenantId,
            subscription_id: subscriptionRowId,
            stripe_invoice_id: inv.id,
            stripe_customer_id: stripeCustomerId,
            number: inv.number,
            amount_due_cents: inv.amount_due ?? 0,
            amount_paid_cents: inv.amount_paid ?? 0,
            currency: inv.currency ?? "usd",
            status,
            hosted_invoice_url: inv.hosted_invoice_url,
            invoice_pdf: inv.invoice_pdf,
            period_start: tsToIso(inv.period_start),
            period_end: tsToIso(inv.period_end),
            paid_at:
              derivedStatus === "paid" && inv.status_transitions?.paid_at
                ? tsToIso(inv.status_transitions.paid_at)
                : null,
          },
          { onConflict: "stripe_invoice_id" },
        )
      if (error) throw error

      // Reflect dunning state on the tenant. Successful payment after a
      // past_due episode flips back to active; payment failure flips to
      // past_due (read-only mode in the app).
      if (derivedStatus === "past_due") {
        await admin
          .from("tenants")
          .update({ status: "past_due" })
          .eq("id", tenantId)
      } else if (derivedStatus === "paid") {
        // Don't blindly set to active — only if currently past_due.
        const { data: t } = await admin
          .from("tenants")
          .select("status")
          .eq("id", tenantId)
          .single()
        if (t?.status === "past_due") {
          await admin
            .from("tenants")
            .update({ status: "active" })
            .eq("id", tenantId)
        }
      }
    },
  )
}
