import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings } from "@/lib/tenant-settings"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { GeneralForm } from "./general-form"

export default async function GeneralSettingsPage() {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)

  return (
    <>
      <SettingsPageHeader
        title="General"
        description="Community name, address, fiscal year, time zone, and primary contact details."
      />
      <GeneralForm identity={settings.identity ?? {}} />
    </>
  )
}
