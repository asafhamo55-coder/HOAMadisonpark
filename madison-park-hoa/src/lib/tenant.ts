/**
 * Tenant context helper.
 *
 * Every server action and route handler in the multi-tenant world must call
 * `getTenantContext()` (or a derivative) at the top of its body. This:
 *
 *   1. Reads the tenant id that middleware.ts pinned to the request via the
 *      `x-tenant-id` header.
 *   2. Calls the SQL function `set_request_tenant(t)` which both verifies
 *      that auth.uid() is an active member of t AND pins the tenant id
 *      into the Postgres session var that RLS policies read from.
 *
 * If either step fails, the helper throws — server actions should let the
 * error bubble so Next.js renders an error boundary instead of silently
 * leaking cross-tenant data.
 *
 * IMPORTANT: do not import this from anywhere outside of server actions /
 * route handlers / RSC. The `headers()` call from `next/headers` only works
 * in those contexts.
 */

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type TenantRole =
  | "owner"
  | "admin"
  | "board"
  | "committee"
  | "resident"
  | "vendor"
  | "readonly"

export type TenantContext = {
  tenantId: string
  tenantSlug: string
  role: TenantRole
  userId: string
  supabase: ReturnType<typeof createClient>
}

/**
 * Returns the active tenant context for the current request.
 * Throws if there is no tenant context or if the user is not a member.
 *
 * For pages/actions where you want to redirect instead of throw, see
 * `requireTenantContext()`.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const h = headers()
  const tenantId = h.get("x-tenant-id")
  const tenantSlug = h.get("x-tenant-slug")
  const role = h.get("x-user-role") as TenantRole | null

  if (!tenantId || !tenantSlug || !role) {
    throw new Error(
      "No tenant context — middleware did not set x-tenant-* headers. " +
        "This route must be reached via /[slug]/...",
    )
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Tenant context requires an authenticated user")
  }

  // Pin tenant id into the Postgres session var so RLS clamps queries.
  // The SQL function will raise if the user is not an active member.
  const { error } = await supabase.rpc("set_request_tenant", { t: tenantId })
  if (error) {
    throw new Error(`set_request_tenant failed: ${error.message}`)
  }

  return {
    tenantId,
    tenantSlug,
    role,
    userId: user.id,
    supabase,
  }
}

/**
 * Same as getTenantContext but redirects to /no-access on failure.
 * Use from pages/server components.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  try {
    return await getTenantContext()
  } catch {
    redirect("/no-access")
  }
}

/**
 * Resolve a tenant by slug WITHOUT requiring membership. Used by middleware
 * and by the platform console. Goes through the anon key + a dedicated
 * read-only policy that allows slug lookups for any signed-in user.
 *
 * Returns null if the slug is unknown or the tenant is soft-deleted.
 */
export async function resolveTenantBySlug(slug: string): Promise<{
  id: string
  slug: string
  status: string
  name: string
} | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from("tenants")
    .select("id, slug, status, name")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle()

  return data ?? null
}

/**
 * List all active tenant memberships for the current user. Used by the
 * /select-tenant picker page after login.
 */
export async function listMyTenants(): Promise<
  Array<{
    tenant_id: string
    slug: string
    name: string
    role: TenantRole
    status: string
  }>
> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("tenant_memberships")
    .select(
      "tenant_id, role, status, tenants!inner(slug, name, status, deleted_at)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("tenants.deleted_at", null)

  if (!data) return []

  type JoinedRow = {
    tenant_id: string
    role: TenantRole
    status: string
    tenants:
      | { slug: string; name: string; status: string; deleted_at: string | null }
      | Array<{ slug: string; name: string; status: string; deleted_at: string | null }>
      | null
  }

  return (data as JoinedRow[])
    .map((row) => {
      const t = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants
      return {
        tenant_id: row.tenant_id,
        slug: t?.slug ?? "",
        name: t?.name ?? "",
        role: row.role,
        status: t?.status ?? "active",
      }
    })
    .filter((r) => r.slug && r.status !== "suspended")
}
