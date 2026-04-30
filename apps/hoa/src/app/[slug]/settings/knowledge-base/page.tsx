import { requireTenantContext } from "@/lib/tenant"
import { getKnowledgeBase } from "@/lib/tenant-settings"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { KnowledgeBaseManager } from "./knowledge-base-manager"

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const { tenantId } = await requireTenantContext()
  const query = searchParams?.q ?? ""
  const entries = await getKnowledgeBase(tenantId, query || null)

  return (
    <>
      <SettingsPageHeader
        title="Knowledge base"
        description="Structured rules and reference content for your community. Searchable via Postgres full-text search. Entries are created manually — there is no AI extraction."
      />
      <KnowledgeBaseManager initialQuery={query} entries={entries} />
    </>
  )
}
