import { requireTenantContext } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"

import { SettingsPageHeader } from "../_components/settings-page-header"

type AuditRow = {
  id: string
  action: string
  entity: string | null
  entity_id: string | null
  actor_email: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: { action?: string }
}) {
  const { tenantId, role } = await requireTenantContext()

  if (role !== "owner" && role !== "admin") {
    return (
      <p className="text-sm text-slate-600">
        Audit logs are restricted to owners and admins.
      </p>
    )
  }

  const supabase = createClient()
  let query = supabase
    .from("audit_log")
    .select(
      "id, action, entity, entity_id, actor_email, metadata, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (searchParams?.action) {
    query = query.ilike("action", `%${searchParams.action}%`)
  }

  const { data } = await query
  const rows: AuditRow[] = (data ?? []) as AuditRow[]

  return (
    <>
      <SettingsPageHeader
        title="Audit log"
        description="Last 100 settings and admin actions, newest first. Every change captured here is keyed to the actor and the affected entity."
      />

      <form className="mb-4 flex items-center gap-2" method="get">
        <input
          name="action"
          defaultValue={searchParams?.action ?? ""}
          placeholder="Filter by action — e.g. settings.branding.update"
          className="w-full max-w-md rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary,#0F2A47)]"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No audit entries match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {r.actor_email ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-900">
                    {r.action}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    {r.entity ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                    {r.metadata
                      ? JSON.stringify(r.metadata).slice(0, 200)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
