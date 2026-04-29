import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings } from "@/lib/tenant-settings"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { FinanceForm } from "./finance-form"

export default async function FinanceSettingsPage() {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)

  return (
    <>
      <SettingsPageHeader
        title="Finance"
        description="Dues amount, billing cadence, late fee, and grace period. The fine schedule has its own tab."
      />
      <FinanceForm
        initial={{
          dues_amount_cents: settings.finance?.dues_amount_cents ?? null,
          dues_cadence: settings.finance?.dues_cadence ?? null,
          due_day_of_month: settings.finance?.due_day_of_month ?? null,
          late_fee_cents: settings.finance?.late_fee_cents ?? null,
          grace_period_days: settings.finance?.grace_period_days ?? null,
        }}
      />
    </>
  )
}
