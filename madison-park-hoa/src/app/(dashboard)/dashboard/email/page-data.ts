import { createClient } from "@/lib/supabase/server"

export type LetterAttachment = {
  name: string
  url: string
  size: number
  type: string
  storagePath: string
}

export type SentLetter = {
  id: string
  property_id: string
  resident_id: string | null
  violation_id: string | null
  type: string
  subject: string
  body_html: string
  sent_at: string | null
  sent_by: string | null
  recipient_email: string | null
  resend_message_id: string | null
  status: string
  created_at: string
  attachments: LetterAttachment[]
  // Joined
  property_address: string
  sent_by_name: string | null
}

export type EmailTemplate = {
  id: string
  name: string
  type: string
  subject_template: string
  body_template: string
  is_active: boolean
  created_at: string
}

export type PropertyOption = {
  id: string
  address: string
}

export type ResidentOption = {
  id: string
  full_name: string
  email: string | null
  property_id: string
}

export type ViolationOption = {
  id: string
  property_id: string
  category: string
  description: string
  severity: string
  reported_date: string | null
  due_date: string | null
  fine_amount: number | null
}

export type EmailPageData = {
  letters: SentLetter[]
  emailTemplates: EmailTemplate[]
  properties: PropertyOption[]
  residents: ResidentOption[]
  violations: ViolationOption[]
}

export async function getEmailPageData(): Promise<EmailPageData> {
  const supabase = createClient()

  const [lettersRes, templatesRes, propertiesRes, residentsRes, violationsRes] =
    await Promise.all([
      supabase
        .from("letters")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),

      supabase
        .from("email_templates")
        .select("*")
        .order("name"),

      supabase
        .from("properties")
        .select("id, address")
        .order("address"),

      supabase
        .from("residents")
        .select("id, full_name, email, property_id")
        .eq("is_current", true),

      supabase
        .from("violations")
        .select("id, property_id, category, description, severity, reported_date, due_date, fine_amount")
        .in("status", ["open", "notice_sent", "warning_sent", "fine_issued"])
        .order("reported_date", { ascending: false }),
    ])

  const rawLetters = lettersRes.data || []
  const properties = (propertiesRes.data || []) as PropertyOption[]
  const residents = (residentsRes.data || []) as ResidentOption[]

  // Enrich letters with property address
  const propertyMap = new Map(properties.map((p) => [p.id, p]))

  // Fetch sender names
  const senderIds = new Set<string>()
  for (const l of rawLetters) {
    if (l.sent_by) senderIds.add(l.sent_by)
  }

  const senderNames = new Map<string, string>()
  if (senderIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(senderIds))
    for (const p of profiles || []) {
      senderNames.set(p.id, p.full_name || "Unknown")
    }
  }

  const letters: SentLetter[] = rawLetters.map((l) => ({
    ...l,
    attachments: (l.attachments as LetterAttachment[]) || [],
    property_address: propertyMap.get(l.property_id)?.address || "Unknown",
    sent_by_name: l.sent_by ? senderNames.get(l.sent_by) || null : null,
  }))

  return {
    letters,
    emailTemplates: (templatesRes.data || []) as EmailTemplate[],
    properties,
    residents,
    violations: (violationsRes.data || []) as ViolationOption[],
  }
}
