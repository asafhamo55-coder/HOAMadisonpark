"use client"

/**
 * Client-side billing actions for the billing page.
 *
 * Two buttons:
 *   - "Manage billing" → POST /api/stripe/portal → redirect to Stripe portal
 *   - "Upgrade plan"   → POST /api/stripe/checkout → redirect to Stripe Checkout
 *
 * Disabled if the user is not owner/admin (the API routes also enforce this
 * server-side; the client gate is just UX).
 */

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type Cycle = "monthly" | "annual"
type PlanId = "starter" | "standard" | "pro"

export function BillingActions({
  hasSubscription,
  canManage,
}: {
  hasSubscription: boolean
  canManage: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<Cycle>("monthly")

  async function openPortal() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "content-type": "application/json" },
        })
        const json = await res.json()
        if (!res.ok || !json.url) {
          throw new Error(json.error || "portal failed")
        }
        window.location.href = json.url
      } catch (e) {
        setError(e instanceof Error ? e.message : "portal failed")
      }
    })
  }

  async function startCheckout(planId: PlanId) {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan_id: planId, billing_cycle: cycle }),
        })
        const json = await res.json()
        if (!res.ok || !json.url) {
          throw new Error(json.error || "checkout failed")
        }
        window.location.href = json.url
      } catch (e) {
        setError(e instanceof Error ? e.message : "checkout failed")
      }
    })
  }

  if (!canManage) {
    return (
      <p className="text-xs text-muted-foreground">
        Only owners and admins can manage billing.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {hasSubscription ? (
          <Button onClick={openPortal} disabled={isPending}>
            {isPending ? "Opening…" : "Manage billing"}
          </Button>
        ) : (
          <>
            <div className="mr-2 inline-flex rounded-md border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCycle("monthly")}
                className={`rounded px-3 py-1 ${cycle === "monthly" ? "bg-primary text-primary-foreground" : ""}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle("annual")}
                className={`rounded px-3 py-1 ${cycle === "annual" ? "bg-primary text-primary-foreground" : ""}`}
              >
                Annual (save 17%)
              </button>
            </div>
            <Button
              onClick={() => startCheckout("starter")}
              disabled={isPending}
              variant="outline"
            >
              Upgrade to Starter
            </Button>
            <Button
              onClick={() => startCheckout("standard")}
              disabled={isPending}
            >
              Upgrade to Standard
            </Button>
            <Button
              onClick={() => startCheckout("pro")}
              disabled={isPending}
              variant="outline"
            >
              Upgrade to Pro
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
