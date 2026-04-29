import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings } from "@/lib/tenant-settings"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { EmailForm } from "./email-form"

export default async function EmailSettingsPage() {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)

  return (
    <>
      <SettingsPageHeader
        title="Email"
        description="From-name, reply-to address, footer, and signature applied to every transactional email this community sends."
      />
      <EmailForm
        initial={{
          from_name: settings.email?.from_name ?? "",
          reply_to: settings.email?.reply_to ?? "",
          footer: settings.email?.footer ?? "",
          signature: settings.email?.signature ?? "",
        }}
      />
    </>
  )
}
