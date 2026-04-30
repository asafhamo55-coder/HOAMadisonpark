/**
 * Tenant usage caps + limit enforcement.
 *
 * Plans (rows in `public.plans`) define caps for each chargeable metric:
 *   - properties        (lifetime count of non-deleted rows)
 *   - seats             (active billable memberships, residents excluded)
 *   - emails_monthly    (count of `usage_events` rows in current calendar month)
 *   - ai_extractions_monthly (always 0 in v1 — DECISIONS.md cuts AI)
 *
 * `assertWithinLimit(tenantId, metric, delta)` runs through the service-role
 * admin client (we need to read across `tenants`, `plans`, and the metric
 * source table without RLS friction; a webhook or cron can call this with no
 * auth context) and throws a structured `LimitExceededError` if the projected
 * count after `delta` would exceed the cap.
 *
 * Caps from `addons` are layered on top: e.g. each `extra_emails` add-on adds
 * +1000/month, each `extra_properties` adds +50, each `extra_seats` adds +1.
 *
 * Per DECISIONS.md item D.4:
 *   "Residents are unlimited; only owner/admin/board/committee/vendor count
 *    toward seats."
 */

import { withAdminClient } from "@/lib/admin"

export type LimitMetric =
  | "properties"
  | "seats"
  | "emails_monthly"
  | "ai_extractions_monthly"

export type LimitPayload = {
  exceeded: true
  metric: LimitMetric
  current: number
  cap: number
  upgradeUrl: string
}

export class LimitExceededError extends Error {
  readonly payload: LimitPayload

  constructor(payload: LimitPayload) {
    super(
      `[limits] ${payload.metric} cap reached: ${payload.current}/${payload.cap}. ` +
        `Upgrade at ${payload.upgradeUrl}`,
    )
    this.name = "LimitExceededError"
    this.payload = payload
  }
}

type PlanRow = {
  id: string
  property_cap: number | null
  seat_cap: number | null
  email_cap_monthly: number | null
  ai_credits_monthly: number
}

type AddonRow = {
  type: "extra_emails" | "extra_properties" | "extra_seats" | "white_label"
  qty: number
  active: boolean
}

/**
 * The four billable membership roles. Residents are excluded by spec.
 * (`readonly` is also non-billable — observers like outside auditors.)
 */
const BILLABLE_ROLES = ["owner", "admin", "board", "committee", "vendor"] as const

/**
 * Compute the start of the current calendar month in ISO format. Email caps
 * reset each month — this is the lower bound of the `usage_events` count.
 */
function startOfMonthIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/**
 * Build the upgrade URL for a tenant. Used in the LimitPayload so callers
 * can deep-link the user to the right place.
 */
function upgradeUrlFor(tenantSlug: string | null | undefined): string {
  if (!tenantSlug) return "/pricing"
  return `/${tenantSlug}/settings/billing?upgrade=1`
}

/**
 * Read the tenant's effective cap for a metric, factoring in add-ons.
 * Returns `null` if the cap is unlimited (unlimited plans).
 */
function effectiveCap(
  metric: LimitMetric,
  plan: PlanRow,
  addons: AddonRow[],
): number | null {
  const activeAddons = addons.filter((a) => a.active)

  switch (metric) {
    case "properties": {
      if (plan.property_cap == null) return null
      const extra = activeAddons
        .filter((a) => a.type === "extra_properties")
        .reduce((sum, a) => sum + 50 * a.qty, 0)
      return plan.property_cap + extra
    }
    case "seats": {
      if (plan.seat_cap == null) return null
      const extra = activeAddons
        .filter((a) => a.type === "extra_seats")
        .reduce((sum, a) => sum + a.qty, 0)
      return plan.seat_cap + extra
    }
    case "emails_monthly": {
      if (plan.email_cap_monthly == null) return null
      const extra = activeAddons
        .filter((a) => a.type === "extra_emails")
        .reduce((sum, a) => sum + 1000 * a.qty, 0)
      return plan.email_cap_monthly + extra
    }
    case "ai_extractions_monthly": {
      // No add-ons ever extend AI credits — AI is fully removed in v1.
      return plan.ai_credits_monthly ?? 0
    }
  }
}

/**
 * Read the tenant's CURRENT usage of a metric.
 */
async function currentUsage(
  tenantId: string,
  metric: LimitMetric,
): Promise<number> {
  return withAdminClient(
    {
      action: "limits.read_usage",
      reason: `compute current usage for ${metric}`,
      tenantId,
      metadata: { metric },
    },
    async (admin) => {
      switch (metric) {
        case "properties": {
          const { count, error } = await admin
            .from("properties")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
          if (error) throw error
          return count ?? 0
        }
        case "seats": {
          const { count, error } = await admin
            .from("tenant_memberships")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("status", "active")
            .in("role", [...BILLABLE_ROLES])
          if (error) throw error
          return count ?? 0
        }
        case "emails_monthly": {
          const { count, error } = await admin
            .from("usage_events")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("metric", "email_sent")
            .gte("created_at", startOfMonthIso())
          if (error) throw error
          return count ?? 0
        }
        case "ai_extractions_monthly": {
          const { count, error } = await admin
            .from("usage_events")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("metric", "ai_extraction")
            .gte("created_at", startOfMonthIso())
          if (error) throw error
          return count ?? 0
        }
      }
    },
  )
}

/**
 * Loads the plan + active add-ons for a tenant. Falls back to the "trial"
 * plan if the tenant has no plan_id (defensive — should not happen post-A
 * migration, but trial caps are the safest default).
 */
async function loadPlanAndAddons(
  tenantId: string,
): Promise<{ plan: PlanRow; addons: AddonRow[]; tenantSlug: string | null }> {
  return withAdminClient(
    {
      action: "limits.load_plan",
      reason: "compute effective cap",
      tenantId,
    },
    async (admin) => {
      const { data: tenant, error: tErr } = await admin
        .from("tenants")
        .select("id, slug, plan_id")
        .eq("id", tenantId)
        .single()
      if (tErr) throw tErr

      const planId = tenant?.plan_id ?? "trial"
      const { data: plan, error: pErr } = await admin
        .from("plans")
        .select("id, property_cap, seat_cap, email_cap_monthly, ai_credits_monthly")
        .eq("id", planId)
        .single()
      if (pErr) throw pErr

      const { data: addons, error: aErr } = await admin
        .from("addons")
        .select("type, qty, active")
        .eq("tenant_id", tenantId)
        .eq("active", true)
      if (aErr) throw aErr

      return {
        plan: plan as PlanRow,
        addons: (addons ?? []) as AddonRow[],
        tenantSlug: tenant?.slug ?? null,
      }
    },
  )
}

/**
 * Compute usage + cap snapshot for a single metric. Used by the billing UI
 * to render progress bars without forcing four separate calls.
 */
export async function getUsageSnapshot(
  tenantId: string,
  metric: LimitMetric,
): Promise<{ current: number; cap: number | null }> {
  const { plan, addons } = await loadPlanAndAddons(tenantId)
  const cap = effectiveCap(metric, plan, addons)
  const current = await currentUsage(tenantId, metric)
  return { current, cap }
}

/**
 * Throws `LimitExceededError` if `currentUsage(metric) + delta > cap`.
 * No-op if cap is null (unlimited) or delta = 0.
 *
 * Use BEFORE the action that would consume the cap (e.g. before inserting
 * a property row, before sending an email).
 */
export async function assertWithinLimit(
  tenantId: string,
  metric: LimitMetric,
  delta = 1,
): Promise<void> {
  if (delta <= 0) return

  const { plan, addons, tenantSlug } = await loadPlanAndAddons(tenantId)
  const cap = effectiveCap(metric, plan, addons)
  if (cap == null) return // unlimited

  const current = await currentUsage(tenantId, metric)
  if (current + delta > cap) {
    throw new LimitExceededError({
      exceeded: true,
      metric,
      current,
      cap,
      upgradeUrl: upgradeUrlFor(tenantSlug),
    })
  }
}

/**
 * Append a `usage_events` row. Use AFTER the chargeable action succeeds so
 * the meter only counts realised events. Best-effort: errors are swallowed
 * so the primary action's success isn't masked by a metering failure.
 */
export async function recordUsage(
  tenantId: string,
  metric: string,
  quantity = 1,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await withAdminClient(
      {
        action: "limits.record_usage",
        reason: `meter ${metric}`,
        tenantId,
        metadata: { metric, quantity },
      },
      async (admin) => {
        await admin.from("usage_events").insert({
          tenant_id: tenantId,
          metric,
          quantity,
          metadata: metadata ?? null,
        })
      },
    )
  } catch (err) {
    // Don't fail the primary action because of a metering glitch.
    console.error(
      "[limits.recordUsage] failed:",
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Public plan listing for the marketing /pricing page. Reads the plans
 * table via the service-role client because the page may render before any
 * auth context exists. Returns only `is_public=true` rows in `sort_order`.
 *
 * Stream B imports this from `@/lib/limits` (or could import from a
 * dedicated module — keeping it co-located here so the plan-cap math and
 * the public listing stay in sync).
 */
export async function getPublicPlans(): Promise<
  Array<{
    id: string
    name: string
    description: string | null
    monthly_cents: number
    annual_cents: number
    property_cap: number | null
    seat_cap: number | null
    email_cap_monthly: number | null
    features: Record<string, unknown>
  }>
> {
  return withAdminClient(
    {
      action: "plans.list_public",
      reason: "render /pricing",
      tenantId: null,
    },
    async (admin) => {
      const { data, error } = await admin
        .from("plans")
        .select(
          "id, name, description, monthly_cents, annual_cents, property_cap, seat_cap, email_cap_monthly, features",
        )
        .eq("is_public", true)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return data ?? []
    },
  )
}
