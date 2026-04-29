import { redirect } from "next/navigation"

import { TenantProvider } from "@/components/tenant-provider"
import { requireTenantContext } from "@/lib/tenant"

/**
 * Tenant top-level layout.
 *
 * Wraps every route under `/[slug]/...` in a TenantProvider so client
 * components below it can read the active tenant via `useTenant()` /
 * `useTenantSlug()` without prop-drilling.
 *
 * Stream E may extend this file to read `tenant_settings` and emit CSS
 * variables for branding (--brand-primary, etc.). This file is written
 * defensively so that merge stays mechanical: the only Stream-G concern
 * here is the TenantProvider wrapper.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  // Pulls x-tenant-id / x-tenant-slug / x-user-role from middleware-set
  // headers. If middleware did not resolve a tenant for this slug (404,
  // not a member, suspended) it would have already redirected, but
  // belt-and-braces:
  const ctx = await requireTenantContext()

  // If the URL slug somehow disagrees with the slug pinned by middleware,
  // kick to /no-access — never serve cross-tenant content.
  if (ctx.tenantSlug !== params.slug) {
    redirect("/no-access")
  }

  // Tenant name lookup. Falls back to slug if the table is unreachable
  // (RLS will allow this read because the user has membership).
  const { data: tenant } = await ctx.supabase
    .from("tenants")
    .select("name")
    .eq("id", ctx.tenantId)
    .maybeSingle()

  const tenantName = tenant?.name ?? params.slug

  return (
    <TenantProvider
      value={{
        tenantId: ctx.tenantId,
        slug: ctx.tenantSlug,
        role: ctx.role,
        tenantName,
      }}
    >
      {children}
    </TenantProvider>
  )
}
