import { requireTenantContext } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { ViolationCategoryList } from "./violation-category-list"

export default async function ViolationCategoriesPage() {
  const { tenantId } = await requireTenantContext()
  const supabase = createClient()

  const { data } = await supabase
    .from("violation_categories")
    .select(
      "id, name, slug, description, default_fine_cents, first_offense_cents, second_offense_cents, third_offense_cents, active, sort_order",
    )
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })

  return (
    <>
      <SettingsPageHeader
        title="Violation categories"
        description="Categories used when logging a violation. Edits flow through to letter templates and the fine schedule."
      />
      <ViolationCategoryList rows={data ?? []} />
    </>
  )
}
