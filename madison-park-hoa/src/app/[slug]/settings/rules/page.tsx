import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings } from "@/lib/tenant-settings"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { RulesForm } from "./rules-form"

export default async function RulesPage() {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)
  const r = settings.rules ?? {}

  return (
    <>
      <SettingsPageHeader
        title="Rules & restrictions"
        description="Leasing cap, minimum lease term, parking and pet rules. These become rule cards on the resident portal."
      />
      <RulesForm
        initial={{
          leasing_cap_pct: r.leasing_cap_pct ?? null,
          lease_min_term_months: r.lease_min_term_months ?? null,
          pets_allowed: r.pets_allowed ?? true,
          parking_notes: r.parking_notes ?? "",
          pet_notes: r.pet_notes ?? "",
        }}
      />
    </>
  )
}
