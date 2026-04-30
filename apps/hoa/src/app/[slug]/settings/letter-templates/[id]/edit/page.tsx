import Link from "next/link"
import { notFound } from "next/navigation"

import { requireTenantContext } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"

import { SettingsPageHeader } from "../../../_components/settings-page-header"
import { LetterTemplateEditor } from "./letter-template-editor"

type LetterTemplate = {
  id: string
  key: string
  name: string
  description: string | null
  channel: "letter" | "email"
  subject: string | null
  body_html: string | null
  variables: string[] | null
  is_system: boolean
  is_default: boolean
  system_key: string | null
}

/** Sample data used by the live preview. */
const SAMPLE_DATA: Record<string, string> = {
  "tenant.name": "Madison Park HOA",
  "tenant.contact_email": "board@madisonparkhoa.com",
  "tenant.portal_url": "https://madison-park.hoaprohub.app",
  "resident.first_name": "Jordan",
  "resident.last_name": "Hayes",
  "property.address": "123 Maple Street",
  "violation.category_name": "Lawn & Landscaping",
  "violation.description": "Lawn exceeds 6 inches in height",
  "violation.cure_by_date": "May 15, 2026",
  "violation.first_notice_date": "April 1, 2026",
  "violation.fine_amount": "$50.00",
  "violation.total_amount": "$125.00",
  "hearing.date": "May 20, 2026",
  "hearing.time": "7:00 PM",
  "hearing.location": "Community Clubhouse",
  "meeting.date": "June 12, 2026",
  "meeting.time": "7:00 PM",
  "meeting.location": "Community Clubhouse",
  "meeting.agenda_item_1": "Approve last meeting minutes",
  "meeting.agenda_item_2": "Treasurer's report",
  "meeting.agenda_item_3": "Pool reopening plan",
  "payment.amount_due": "$150.00",
  "payment.due_date": "April 1, 2026",
  "payment.days_late": "28",
  "payment.late_fees": "$25.00",
  "announcement.subject": "Pool reopening this Saturday",
  "announcement.body":
    "The community pool reopens this Saturday at 10am. Please bring your fob.",
}

export default async function LetterTemplateEditPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const { tenantId, tenantSlug } = await requireTenantContext()
  const supabase = createClient()

  const { data } = await supabase
    .from("letter_templates")
    .select(
      "id, key, name, description, channel, subject, body_html, variables, is_system, is_default, system_key",
    )
    .eq("tenant_id", tenantId)
    .eq("id", params.id)
    .maybeSingle()

  if (!data) notFound()
  const tpl = data as LetterTemplate

  // Load recent versions
  const { data: versions } = await supabase
    .from("letter_template_versions")
    .select("version, edited_by, edit_note, created_at")
    .eq("template_id", tpl.id)
    .order("version", { ascending: false })
    .limit(20)

  return (
    <>
      <SettingsPageHeader
        title={tpl.name}
        description={
          tpl.description ??
          `Editing the ${tpl.channel} template "${tpl.key}". Each save creates a new version.`
        }
      />
      <div className="mb-4 text-sm">
        <Link
          href={`/${tenantSlug}/settings/letter-templates`}
          className="text-slate-600 hover:underline"
        >
          ← Back to all templates
        </Link>
      </div>
      <LetterTemplateEditor
        template={{
          id: tpl.id,
          name: tpl.name,
          description: tpl.description ?? "",
          subject: tpl.subject ?? "",
          body_html: tpl.body_html ?? "",
          variables: tpl.variables ?? [],
          channel: tpl.channel,
        }}
        sample={SAMPLE_DATA}
        versions={versions ?? []}
      />
    </>
  )
}
