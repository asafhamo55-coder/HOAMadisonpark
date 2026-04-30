import { redirect } from "next/navigation"

import { tenantPath } from "@/lib/tenant-path"
import { getTenantContext } from "@/lib/tenant"

export type ModuleKey = "hoa" | "property" | "eviction"

export const MODULE_LABELS: Record<ModuleKey, string> = {
  hoa: "HOA Hub",
  property: "Property Management",
  eviction: "Eviction Hub",
}

/**
 * Server-side guard: require an active tenant context AND that the
 * tenant has the named module enabled (active or trial). Redirects
 * to /[slug] with a banner if the module is not entitled.
 */
export async function requireTenantModule(module: ModuleKey) {
  const ctx = await getTenantContext()
  const { data, error } = await ctx.supabase.rpc("tenant_has_module", {
    t: ctx.tenantId,
    mod: module,
  })
  if (error) throw new Error(`tenant_has_module check failed: ${error.message}`)
  if (!data) {
    redirect(tenantPath(ctx.tenantSlug, `?missing=${module}`))
  }
  return ctx
}

/**
 * Returns the set of modules currently entitled for the active tenant.
 */
export async function getActiveModules(): Promise<ModuleKey[]> {
  const ctx = await getTenantContext()
  const { data } = await ctx.supabase
    .from("tenant_modules")
    .select("module")
    .eq("tenant_id", ctx.tenantId)
    .in("status", ["active", "trial"])
  return (data ?? []).map((r) => r.module as ModuleKey)
}
