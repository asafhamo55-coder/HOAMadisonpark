import { requireTenantContext } from "@/lib/tenant"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { DangerZoneActions } from "./danger-zone-actions"

export default async function DangerZonePage() {
  const { role } = await requireTenantContext()

  if (role !== "owner") {
    return (
      <>
        <SettingsPageHeader
          title="Danger zone"
          description="Owner-only actions."
        />
        <p className="text-sm text-slate-600">
          The danger zone is restricted to the community owner.
        </p>
      </>
    )
  }

  return (
    <>
      <SettingsPageHeader
        title="Danger zone"
        description="Irreversible or large-impact actions. Owner-only."
      />
      <DangerZoneActions />
    </>
  )
}
