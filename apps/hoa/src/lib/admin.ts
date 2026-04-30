/**
 * Service-role-scoped admin helpers — DANGER ZONE.
 *
 * The Supabase service-role key bypasses ALL Row-Level Security. Code that
 * uses it can read or write any row in any tenant. Allowed callers:
 *
 *   • Stripe webhook handler (Stream D)         — no auth context yet
 *   • Cron jobs / scheduled tasks (Stream H)    — no auth context yet
 *   • Tenant onboarding (Stream C)              — must create tenant + first
 *                                                 membership in one txn
 *   • Platform console actions (Stream F)       — explicit cross-tenant ops
 *   • Invitation acceptance (Stream A)          — token-based, no membership yet
 *   • Tenant resolver in middleware             — looking up slug → id
 *
 * Every other call site MUST use `getTenantContext()` from `lib/tenant.ts`
 * instead, which goes through RLS.
 *
 * EVERY call through this module writes a row to `platform_audit_log`. There
 * is no opt-out. If you don't want an audit row, you don't want service-role.
 *
 * NOTE: the existing app's `lib/supabase/admin.ts` is a thinner wrapper that
 * predates the multi-tenant work. Stream G owns the migration of the existing
 * server actions in `src/app/actions/*` to use `getTenantContext()` instead.
 * Until then, the CI grep script in `scripts/check-no-service-role.sh`
 * whitelists `lib/supabase/admin.ts` as a known legacy entry point.
 */

import { createClient as createSbClient, type SupabaseClient } from "@supabase/supabase-js"
import { headers } from "next/headers"

import { createClient as createServerClient } from "@/lib/supabase/server"

type AdminAction = {
  /** Stable identifier, e.g. "tenant.create", "stripe.webhook.subscription_updated". */
  action: string
  /** Free-form justification — required so a human reviewer can audit. */
  reason: string
  /** Tenant the action affects, if any. NULL for cross-tenant ops. */
  tenantId?: string | null
  /** Entity name (e.g. "tenants", "subscriptions"). */
  entity?: string
  /** Entity id, stringified. */
  entityId?: string
  /** Snapshot before the change. */
  before?: unknown
  /** Snapshot after the change. */
  after?: unknown
  /** Any extra metadata. */
  metadata?: Record<string, unknown>
}

let cachedAdminClient: SupabaseClient | null = null

function getServiceRoleClient(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    )
  }

  cachedAdminClient = createSbClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return cachedAdminClient
}

/**
 * Resolve the actor (the authenticated user, if any) for the audit row.
 * Falls back to no actor when running outside a request context (e.g. cron).
 */
async function resolveActor(): Promise<{
  actorId: string | null
  actorEmail: string | null
  ipAddress: string | null
  userAgent: string | null
}> {
  let actorId: string | null = null
  let actorEmail: string | null = null
  let ipAddress: string | null = null
  let userAgent: string | null = null

  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    actorId = user?.id ?? null
    actorEmail = user?.email ?? null
  } catch {
    // No request context (e.g. running in a cron job) — leave actor null.
  }

  try {
    const h = headers()
    ipAddress =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null
    userAgent = h.get("user-agent") ?? null
  } catch {
    // Same — no request context.
  }

  return { actorId, actorEmail, ipAddress, userAgent }
}

/**
 * Run a function with a service-role Supabase client and write a
 * `platform_audit_log` row describing what happened.
 *
 * Usage:
 *
 *   await withAdminClient(
 *     { action: "tenant.create", reason: "onboarding signup", tenantId: null },
 *     async (admin) => {
 *       const { data } = await admin.from("tenants").insert({...}).select().single()
 *       return data
 *     },
 *   )
 *
 * If the inner function throws, the audit row is still written with
 * `metadata.error` set to the error message.
 */
export async function withAdminClient<T>(
  action: AdminAction,
  fn: (admin: SupabaseClient) => Promise<T>,
): Promise<T> {
  const admin = getServiceRoleClient()
  const actor = await resolveActor()

  let result: T
  let errorMessage: string | null = null
  try {
    result = await fn(admin)
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
    // Best-effort: still log the failure before re-throwing.
    await admin.from("platform_audit_log").insert({
      tenant_id: action.tenantId ?? null,
      actor_id: actor.actorId,
      actor_email: actor.actorEmail,
      action: action.action,
      reason: action.reason,
      entity: action.entity ?? null,
      entity_id: action.entityId ?? null,
      before: action.before ?? null,
      after: action.after ?? null,
      metadata: { ...(action.metadata ?? {}), error: errorMessage },
      ip_address: actor.ipAddress,
      user_agent: actor.userAgent,
    })
    throw err
  }

  await admin.from("platform_audit_log").insert({
    tenant_id: action.tenantId ?? null,
    actor_id: actor.actorId,
    actor_email: actor.actorEmail,
    action: action.action,
    reason: action.reason,
    entity: action.entity ?? null,
    entity_id: action.entityId ?? null,
    before: action.before ?? null,
    after: action.after ?? null,
    metadata: action.metadata ?? null,
    ip_address: actor.ipAddress,
    user_agent: actor.userAgent,
  })

  return result
}

/**
 * Direct service-role client (no automatic audit row).
 *
 * Reserved for use cases where the audit row must be written manually with
 * specific timing — e.g. inside a transaction. If you find yourself reaching
 * for this, prefer `withAdminClient` first.
 */
export function unsafeServiceRoleClient(): SupabaseClient {
  return getServiceRoleClient()
}
