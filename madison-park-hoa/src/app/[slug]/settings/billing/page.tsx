/**
 * Tenant billing settings page.
 *
 * Route: /[slug]/settings/billing
 *
 * Shows:
 *   - Current plan card (plan name, status, amount, next billing date)
 *   - "Manage billing" button → opens Stripe Customer Portal
 *   - Usage panel (properties X/Y, billable seats X/Y, emails X/Y)
 *   - Upgrade comparison table (other plans + monthly/annual prices)
 *   - Invoice history (last 12)
 *
 * Data is loaded server-side via getTenantContext + admin lookups (the
 * subscriptions/invoices tables are tenant-scoped via RLS, but plans is
 * public-readable). The Manage/Upgrade buttons are a client component
 * that POSTs to /api/stripe/portal or /api/stripe/checkout.
 *
 * Stream E owns app/[slug]/settings/layout.tsx and the surrounding tab
 * nav — this page slots inside that.
 */

import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { withAdminClient } from "@/lib/admin"
import { getUsageSnapshot } from "@/lib/limits"
import { isTestMode } from "@/lib/stripe"
import { requireTenantContext } from "@/lib/tenant"

import { BillingActions } from "./billing-actions"

// Force dynamic rendering — uses request cookies / tenant header.
export const dynamic = "force-dynamic"

type PlanRow = {
  id: string
  name: string
  description: string | null
  monthly_cents: number
  annual_cents: number
  property_cap: number | null
  seat_cap: number | null
  email_cap_monthly: number | null
  features: Record<string, unknown> | null
  is_public: boolean
  sort_order: number
}

type SubscriptionRow = {
  id: string
  stripe_subscription_id: string | null
  status: string
  billing_cycle: "monthly" | "annual" | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_ends_at: string | null
  plan_id: string | null
}

type InvoiceRow = {
  id: string
  number: string | null
  amount_due_cents: number
  amount_paid_cents: number
  status: string
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  created_at: string
}

type TenantRow = {
  id: string
  name: string
  status: string
  plan_id: string | null
  trial_ends_at: string | null
}

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active" || status === "trialing" || status === "trial") {
    return "default"
  }
  if (status === "past_due" || status === "unpaid" || status === "canceled") {
    return "destructive"
  }
  return "secondary"
}

export default async function BillingPage() {
  const ctx = await requireTenantContext()

  const data = await withAdminClient(
    {
      action: "billing.page.load",
      reason: "render /settings/billing",
      tenantId: ctx.tenantId,
    },
    async (admin) => {
      const [tenantRes, subRes, invRes, plansRes] = await Promise.all([
        admin
          .from("tenants")
          .select("id, name, status, plan_id, trial_ends_at")
          .eq("id", ctx.tenantId)
          .single(),
        admin
          .from("subscriptions")
          .select(
            "id, stripe_subscription_id, status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, plan_id",
          )
          .eq("tenant_id", ctx.tenantId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("invoices")
          .select(
            "id, number, amount_due_cents, amount_paid_cents, status, hosted_invoice_url, invoice_pdf, created_at",
          )
          .eq("tenant_id", ctx.tenantId)
          .order("created_at", { ascending: false })
          .limit(12),
        admin
          .from("plans")
          .select(
            "id, name, description, monthly_cents, annual_cents, property_cap, seat_cap, email_cap_monthly, features, is_public, sort_order",
          )
          .order("sort_order", { ascending: true }),
      ])

      return {
        tenant: tenantRes.data as TenantRow | null,
        subscription: (subRes.data ?? null) as SubscriptionRow | null,
        invoices: (invRes.data ?? []) as InvoiceRow[],
        plans: (plansRes.data ?? []) as PlanRow[],
      }
    },
  )

  if (!data.tenant) {
    return (
      <div className="p-6">
        <p className="text-destructive">Tenant not found.</p>
      </div>
    )
  }

  const currentPlan =
    data.plans.find((p) => p.id === (data.subscription?.plan_id ?? data.tenant!.plan_id)) ??
    data.plans.find((p) => p.id === "trial") ??
    null

  const [propsUsage, seatsUsage, emailsUsage] = await Promise.all([
    getUsageSnapshot(ctx.tenantId, "properties"),
    getUsageSnapshot(ctx.tenantId, "seats"),
    getUsageSnapshot(ctx.tenantId, "emails_monthly"),
  ])

  const showTestBanner = isTestMode()

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {showTestBanner && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <strong>Stripe test mode.</strong> Use card{" "}
          <code className="font-mono">4242 4242 4242 4242</code> with any future
          expiry / CVC. No real charges will be made.
        </div>
      )}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, view invoices, and track usage.
        </p>
      </header>

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{currentPlan?.name ?? "No plan"}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan?.description ?? ""}
              </p>
            </div>
            <Badge variant={statusBadgeVariant(data.tenant.status)}>
              {data.tenant.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Billing cycle</dt>
              <dd className="font-medium capitalize">
                {data.subscription?.billing_cycle ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">
                {currentPlan && data.subscription?.billing_cycle === "annual"
                  ? `${dollars(currentPlan.annual_cents)}/yr`
                  : currentPlan
                    ? `${dollars(currentPlan.monthly_cents)}/mo`
                    : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Next bill</dt>
              <dd className="font-medium">
                {data.subscription?.current_period_end
                  ? format(
                      new Date(data.subscription.current_period_end),
                      "MMM d, yyyy",
                    )
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Trial ends</dt>
              <dd className="font-medium">
                {data.tenant.trial_ends_at
                  ? format(new Date(data.tenant.trial_ends_at), "MMM d, yyyy")
                  : "—"}
              </dd>
            </div>
          </dl>

          {data.subscription?.cancel_at_period_end && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Subscription is set to cancel at the end of the current period.
            </p>
          )}

          <BillingActions
            hasSubscription={Boolean(data.subscription?.stripe_subscription_id)}
            canManage={ctx.role === "owner" || ctx.role === "admin"}
          />
        </CardContent>
      </Card>

      {/* Usage panel */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar
            label="Properties"
            current={propsUsage.current}
            cap={propsUsage.cap}
          />
          <UsageBar
            label="Billable seats (admins / board / committee / vendors)"
            current={seatsUsage.current}
            cap={seatsUsage.cap}
          />
          <UsageBar
            label="Emails this month"
            current={emailsUsage.current}
            cap={emailsUsage.cap}
          />
          <p className="pt-2 text-xs text-muted-foreground">
            Residents are unlimited and never count toward billable seats.
          </p>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Compare plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {data.plans
              .filter((p) => p.is_public)
              .map((p) => (
                <div
                  key={p.id}
                  className={`rounded-md border p-4 ${
                    p.id === currentPlan?.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-medium">{p.name}</h3>
                    {p.id === currentPlan?.id && (
                      <span className="text-xs text-primary">Current</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {dollars(p.monthly_cents)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or {dollars(p.annual_cents)}/yr (save 17%)
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <li>
                      Properties:{" "}
                      {p.property_cap == null ? "unlimited" : p.property_cap}
                    </li>
                    <li>
                      Seats: {p.seat_cap == null ? "unlimited" : p.seat_cap}
                    </li>
                    <li>
                      Emails/mo:{" "}
                      {p.email_cap_monthly == null
                        ? "unlimited"
                        : p.email_cap_monthly.toLocaleString()}
                    </li>
                  </ul>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {data.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices yet. They&apos;ll appear here after your first
              payment.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-normal">Date</th>
                  <th className="pb-2 font-normal">Number</th>
                  <th className="pb-2 font-normal">Amount</th>
                  <th className="pb-2 font-normal">Status</th>
                  <th className="pb-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="py-2">
                      {format(new Date(inv.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {inv.number ?? "—"}
                    </td>
                    <td className="py-2">
                      {dollars(inv.amount_paid_cents || inv.amount_due_cents)}
                    </td>
                    <td className="py-2">
                      <Badge variant={statusBadgeVariant(inv.status)}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      {inv.hosted_invoice_url && (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </a>
                      )}
                      {inv.invoice_pdf && (
                        <a
                          href={inv.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 text-xs text-primary hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UsageBar({
  label,
  current,
  cap,
}: {
  label: string
  current: number
  cap: number | null
}) {
  const pct = cap == null ? 0 : Math.min(100, Math.round((current / cap) * 100))
  const over = cap != null && current >= cap
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {current.toLocaleString()} / {cap == null ? "unlimited" : cap.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        {cap != null && (
          <div
            className={`h-full ${over ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  )
}
