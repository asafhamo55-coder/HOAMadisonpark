/**
 * Stripe Checkout session creator.
 *
 * POST /api/stripe/checkout
 * Body: { plan_id: 'starter'|'standard'|'pro', billing_cycle: 'monthly'|'annual' }
 *
 * The caller must be in a tenant context (page is rendered under
 * `/[slug]/...`). We pull tenant + tenant slug from `getTenantContext()`,
 * look up the Stripe price id from the `plans` table, and create a
 * subscription-mode Checkout Session.
 *
 * Metadata: { tenant_id, plan_id, billing_cycle } — the webhook reads these
 * when `customer.subscription.created` fires to know which tenant + plan to
 * mirror into our DB.
 *
 * No tax line — DECISIONS.md drops Stripe Tax in v1.
 */

import { NextResponse } from "next/server"
import { z } from "zod"

import { withAdminClient } from "@/lib/admin"
import { getStripe } from "@/lib/stripe"
import { getTenantContext } from "@/lib/tenant"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({
  plan_id: z.enum(["starter", "standard", "pro"]),
  billing_cycle: z.enum(["monthly", "annual"]),
})

export async function POST(req: Request): Promise<Response> {
  let parsed: z.infer<typeof Body>
  try {
    const json = await req.json()
    parsed = Body.parse(json)
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid body"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  let ctx: Awaited<ReturnType<typeof getTenantContext>>
  try {
    ctx = await getTenantContext()
  } catch (err) {
    const message = err instanceof Error ? err.message : "no tenant context"
    return NextResponse.json({ error: message }, { status: 401 })
  }

  // Only owner/admin can create a checkout session — billing changes the
  // tenant's commercial state and must be initiated by someone authorized.
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return NextResponse.json(
      { error: "only owners and admins can manage billing" },
      { status: 403 },
    )
  }

  // Look up the Stripe price id + reuse existing customer if present.
  const lookup = await withAdminClient(
    {
      action: "stripe.checkout.lookup",
      reason: "resolve plan price + existing customer",
      tenantId: ctx.tenantId,
      metadata: { planId: parsed.plan_id, cycle: parsed.billing_cycle },
    },
    async (admin) => {
      const { data: plan, error: planErr } = await admin
        .from("plans")
        .select("id, stripe_price_monthly, stripe_price_annual")
        .eq("id", parsed.plan_id)
        .single()
      if (planErr) throw planErr

      const priceId =
        parsed.billing_cycle === "monthly"
          ? plan.stripe_price_monthly
          : plan.stripe_price_annual

      const { data: existingSub } = await admin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("tenant_id", ctx.tenantId)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: tenant } = await admin
        .from("tenants")
        .select("name, slug")
        .eq("id", ctx.tenantId)
        .single()

      return {
        priceId,
        existingCustomerId: existingSub?.stripe_customer_id ?? null,
        tenantName: tenant?.name ?? "HOA Pro Hub Tenant",
        tenantSlug: tenant?.slug ?? ctx.tenantSlug,
      }
    },
  )

  if (!lookup.priceId) {
    return NextResponse.json(
      {
        error: `no Stripe price configured for plan=${parsed.plan_id} cycle=${parsed.billing_cycle}. ` +
          "Operator must set plans.stripe_price_monthly / plans.stripe_price_annual.",
      },
      { status: 500 },
    )
  }

  // Resolve actor email for prefilling Checkout
  const {
    data: { user },
  } = await ctx.supabase.auth.getUser()
  const customerEmail = user?.email ?? undefined

  // Build absolute return URLs from the request origin so we don't depend
  // on a NEXT_PUBLIC_APP_URL env that may not be set in dev.
  const origin = req.headers.get("origin") ?? new URL(req.url).origin
  const successUrl = `${origin}/${lookup.tenantSlug}/settings/billing?success=1&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}/${lookup.tenantSlug}/settings/billing?cancelled=1`

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: lookup.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Reuse existing Stripe customer id if we have one (so portal
      // continues to work and proration is computed correctly).
      ...(lookup.existingCustomerId
        ? { customer: lookup.existingCustomerId }
        : { customer_email: customerEmail }),
      // No automatic_tax — Stripe Tax is dropped per DECISIONS.md.
      automatic_tax: { enabled: false },
      // Allow promotion codes for our own promo flow later.
      allow_promotion_codes: true,
      // Metadata travels onto the resulting subscription so the webhook
      // can map the new sub back to our tenant + plan.
      metadata: {
        tenant_id: ctx.tenantId,
        plan_id: parsed.plan_id,
        billing_cycle: parsed.billing_cycle,
      },
      subscription_data: {
        metadata: {
          tenant_id: ctx.tenantId,
          plan_id: parsed.plan_id,
          billing_cycle: parsed.billing_cycle,
        },
      },
      client_reference_id: ctx.tenantId,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout failed"
    console.error("[stripe.checkout] session creation failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
