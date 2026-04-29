import { requireTenantContext } from "@/lib/tenant"
import {
  getTenantSettings,
  resolveBranding,
} from "@/lib/tenant-settings"

/**
 * Per-tenant root layout.
 *
 * Pulls the tenant's branding tokens from `tenant_settings.branding`
 * and injects them as CSS variables so any descendant component can
 * theme itself with `var(--tenant-primary)` / `var(--tenant-accent)`.
 *
 * Branding only updates on the next page load (no hot-reload), which
 * is exactly what the validation gate calls for.
 */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)
  const brand = resolveBranding(settings.branding)

  const css = `:root {
  --tenant-primary: ${brand.primary};
  --tenant-accent: ${brand.accent};
}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  )
}
