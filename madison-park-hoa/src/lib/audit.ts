/**
 * Per-tenant audit log helper.
 *
 * Wraps `audit_log` inserts so callers don't need to remember to pass
 * tenant_id, actor, ip, etc. Reads tenant context from the request via
 * `getTenantContext()`.
 *
 * Use this for every state-changing server action. Read-only actions
 * (selects) generally do NOT need an audit row — focus on writes.
 *
 * Example:
 *
 *   import { audit } from "@/lib/audit"
 *
 *   await audit.log({
 *     action: "violation.create",
 *     entity: "violations",
 *     entityId: violation.id,
 *     metadata: { property_id, category, severity },
 *   })
 */

import { headers } from "next/headers"

import { getTenantContext } from "@/lib/tenant"

type AuditEntry = {
  /** Stable identifier, e.g. "violation.create", "letter.send". */
  action: string
  /** Entity name (table name), e.g. "violations". */
  entity?: string
  /** Entity primary key. */
  entityId?: string
  /** Free-form structured payload — old/new diffs, ids, etc. */
  metadata?: Record<string, unknown>
}

async function readRequestMeta(): Promise<{
  ipAddress: string | null
  userAgent: string | null
}> {
  try {
    const h = headers()
    return {
      ipAddress:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null,
      userAgent: h.get("user-agent") ?? null,
    }
  } catch {
    return { ipAddress: null, userAgent: null }
  }
}

export const audit = {
  /**
   * Append a row to `audit_log` scoped to the current tenant.
   * Best-effort: any error is logged to console and swallowed so the
   * primary action does not fail because of audit-log issues.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      const { tenantId, userId, supabase } = await getTenantContext()
      const meta = await readRequestMeta()

      // Pull email for human-readable display
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("audit_log").insert({
        tenant_id: tenantId,
        actor_id: userId,
        actor_email: user?.email ?? null,
        action: entry.action,
        entity: entry.entity ?? null,
        entity_id: entry.entityId ?? null,
        metadata: entry.metadata ?? null,
        ip_address: meta.ipAddress,
        user_agent: meta.userAgent,
        // Legacy columns (kept for the existing single-tenant audit reader UI):
        user_id: userId,
        user_name: user?.email ?? null,
        entity_type: entry.entity ?? null,
        details: entry.metadata ?? null,
      })

      if (error) {
        console.error("[audit.log] insert failed:", error.message, entry)
      }
    } catch (err) {
      console.error(
        "[audit.log] could not resolve tenant context:",
        err instanceof Error ? err.message : err,
      )
    }
  },
}
