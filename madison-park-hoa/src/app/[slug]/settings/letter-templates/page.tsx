import Link from "next/link"

import { requireTenantContext } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"

import { SettingsPageHeader } from "../_components/settings-page-header"

export default async function LetterTemplatesPage() {
  const { tenantId, tenantSlug } = await requireTenantContext()
  const supabase = createClient()

  const { data } = await supabase
    .from("letter_templates")
    .select(
      "id, key, name, description, channel, is_default, is_system, updated_at",
    )
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true })

  return (
    <>
      <SettingsPageHeader
        title="Letter templates"
        description="Edit the letters and emails sent for violations, payments, and announcements. Each save creates a new version row."
      />

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(data ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No templates yet. Defaults are seeded on tenant creation.
                </td>
              </tr>
            ) : (
              (data ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{t.name}</div>
                    {t.description ? (
                      <div className="text-xs text-slate-500">
                        {t.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 capitalize">{t.channel}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    {t.key}
                  </td>
                  <td className="px-3 py-2">
                    {t.is_system ? (
                      <Badge variant="secondary">System</Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/${tenantSlug}/settings/letter-templates/${t.id}/edit`}
                      className="text-sm font-medium text-[var(--tenant-primary,#0F2A47)] hover:underline"
                    >
                      Edit
                    </Link>
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
