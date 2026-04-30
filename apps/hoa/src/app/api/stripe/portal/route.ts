/**
 * Stripe Customer Portal session creator.
 *
 * POST /api/stripe/portal
 *
 * Looks up the most recent subscription row for the tenant, grabs the
 * `stripe_customer_id`, and creates a billing portal session that lets the
 * tenant's owner/admin manage their payment method, view invoices, change
 * plans, or cancel — all on Stripe's hosted UI.
 *
 * Self-serve plan changes (and proration) are handled by Stripe; the
 * `customer.subscription.updated` webhook syncs the resulting state back to
 * our DB.
 */

import { NextResponse } from "next/server"

import { withAdminClient } from "@/lib/admin"
import { getStripe } from "@/lib/stripe"
import { getTenantContext } from "@/lib/tenant"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof getTenantContext>>
  try {
    ctx = await getTenantContext()
  } catch (err) {
    const message = err instanceof Error ? err.message : "no tenant context"
    return NextResponse.json({ error: message }, { status: 401 })
  }

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return NextResponse.json(
      { error: "only owners and admins can manage billing" },
      { status: 403 },
    )
  }

  const customer = await withAdminClient(
    {
      action: "stripe.portal.lookup",
      reason: "find stripe_customer_id for portal session",
      tenantId: ctx.tenantId,
    },
    async (admin) => {
      const { data } = await admin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("tenant_id", ctx.tenantId)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      return data?.stripe_customer_id ?? null
    },
  )

  if (!customer) {
    return NextResponse.json(
      {
        error:
          "No Stripe customer on file for this tenant. Complete a checkout " +
          "first so the customer record exists, then return to manage billing.",
      },
      { status: 400 },
    )
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin
  const returnUrl = `${origin}/${ctx.tenantSlug}/settings/billing`

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "portal failed"
    console.error("[stripe.portal] session creation failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
