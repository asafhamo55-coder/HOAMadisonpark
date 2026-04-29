import { redirect } from "next/navigation"

import { TenantProvider } from "@/components/tenant-provider"
import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings, resolveBranding } from "@/lib/tenant-settings"

/**
 * Tenant top-level layout.
 *
 * Wraps every route under `/[slug]/...` in a TenantProvider so client
 * components below it can read the active tenant via `useTenant()` /
 * `useTenantSlug()` without prop-drilling.
 *
 * Also reads `tenant_settings.branding` and injects CSS variables
 * (`--tenant-primary`, `--tenant-accent`) so any descendant component
 * can theme itself with `var(--tenant-primary)`. Branding only updates
 * on the next page load.
 *
 * Combines Stream G's TenantProvider with Stream E's branding propagation.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const ctx = await requireTenantContext()

  if (ctx.tenantSlug !== params.slug) {
    redirect("/no-access")
  }

  const [{ data: tenant }, settings] = await Promise.all([
    ctx.supabase.from("tenants").select("name").eq("id", ctx.tenantId).maybeSingle(),
    getTenantSettings(ctx.tenantId),
  ])

  const tenantName = tenant?.name ?? params.slug
  const brand = resolveBranding(settings.branding)

  const css = `:root {
  --tenant-primary: ${brand.primary};
  --tenant-accent: ${brand.accent};
}`

  return (
    <TenantProvider
      value={{
        tenantId: ctx.tenantId,
        slug: ctx.tenantSlug,
        role: ctx.role,
        tenantName,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </TenantProvider>
  )
}
