import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings, resolveBranding } from "@/lib/tenant-settings"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { BrandingForm } from "./branding-form"

export default async function BrandingSettingsPage() {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)
  const brand = resolveBranding(settings.branding)

  return (
    <>
      <SettingsPageHeader
        title="Branding"
        description="Logo, colors, letterhead, and login screen image. Changes apply to the dashboard, transactional emails, and PDF letters on the next page load."
      />
      <BrandingForm
        initial={{
          primary: brand.primary,
          accent: brand.accent,
          logo_url: brand.logo_url ?? "",
          letterhead_url: brand.letterhead_url ?? "",
          login_image_url: brand.login_image_url ?? "",
        }}
      />
    </>
  )
}
