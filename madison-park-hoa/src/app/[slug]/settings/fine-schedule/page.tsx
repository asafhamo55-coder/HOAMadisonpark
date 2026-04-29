import { requireTenantContext } from "@/lib/tenant"
import { getTenantSettings } from "@/lib/tenant-settings"
import { createClient } from "@/lib/supabase/server"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { FineScheduleEditor } from "./fine-schedule-editor"

type Row = {
  id: string
  name: string
  slug: string
  default_fine_cents: number
  first_offense_cents: number | null
  second_offense_cents: number | null
  third_offense_cents: number | null
}

export default async function FineSchedulePage() {
  const { tenantId } = await requireTenantContext()
  const settings = await getTenantSettings(tenantId)

  // Pull from violation_categories first (canonical source).
  const supabase = createClient()
  const { data } = await supabase
    .from("violation_categories")
    .select(
      "id, name, slug, default_fine_cents, first_offense_cents, second_offense_cents, third_offense_cents",
    )
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order", { ascending: true })

  const fromCategories: Row[] = (data ?? []) as Row[]

  // The settings.finance.fine_schedule[] is a denormalized cache for any
  // free-form rows the tenant added that don't tie to a category.
  const extraRows = settings.finance?.fine_schedule ?? []

  return (
    <>
      <SettingsPageHeader
        title="Fine schedule"
        description="Per-category fine amounts for 1st / 2nd / 3rd offenses. Drives the violation state machine."
      />
      <FineScheduleEditor categories={fromCategories} extra={extraRows} />
    </>
  )
}
