import { createClient } from "@/lib/supabase/server"

export type Resident = {
  id: string
  property_id: string
  profile_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  type: "owner" | "tenant" | "co-owner"
  move_in_date: string | null
  move_out_date: string | null
  is_current: boolean
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  vehicles: string[] | null
  pets: string[] | null
  notes: string | null
  created_at: string
}

export type Violation = {
  id: string
  property_id: string
  resident_id: string | null
  category: string
  description: string
  status: string
  severity: string
  reported_by: string | null
  reported_date: string | null
  due_date: string | null
  resolved_date: string | null
  fine_amount: number | null
  fine_paid: boolean
  photos: string[] | null
  notes: string | null
  created_at: string
  reported_by_name?: string | null
  linked_letter_id?: string | null
}

export type Letter = {
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
  sent_by_name?: string | null
}

export type Payment = {
  id: string
  property_id: string
  resident_id: string | null
  amount: number
  due_date: string | null
  paid_date: string | null
  payment_method: string | null
  status: string
  period: string | null
  notes: string | null
  created_at: string
}

export type Property = {
  id: string
  address: string
  lot_number: string | null
  street: string | null
  unit: string | null
  zip: string | null
  city: string | null
  state: string | null
  status: "occupied" | "vacant" | "foreclosure" | "rental"
  notes: string | null
  created_at: string
}

export type PropertyDetail = {
  property: Property
  currentResidents: Resident[]
  formerResidents: Resident[]
  violations: Violation[]
  letters: Letter[]
  payments: Payment[]
}

export async function getPropertyDetail(
  id: string
): Promise<PropertyDetail | null> {
  const supabase = createClient()

  const [propertyRes, residentsRes, violationsRes, lettersRes, paymentsRes] =
    await Promise.all([
      supabase.from("properties").select("*").eq("id", id).single(),

      supabase
        .from("residents")
        .select("*")
        .eq("property_id", id)
        .order("is_current", { ascending: false })
        .order("move_in_date", { ascending: false }),

      supabase
        .from("violations")
        .select("*")
        .eq("property_id", id)
        .order("reported_date", { ascending: false }),

      supabase
        .from("letters")
        .select("*")
        .eq("property_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .eq("property_id", id)
        .order("due_date", { ascending: false }),
    ])

  if (!propertyRes.data) return null

  const residents = (residentsRes.data || []) as Resident[]
  const violations = (violationsRes.data || []) as Violation[]
  const letters = (lettersRes.data || []) as Letter[]

  // Enrich violations with linked letters
  const letterByViolation = new Map<string, string>()
  for (const l of letters) {
    if (l.violation_id && !letterByViolation.has(l.violation_id)) {
      letterByViolation.set(l.violation_id, l.id)
    }
  }
  for (const v of violations) {
    v.linked_letter_id = letterByViolation.get(v.id) || null
  }

  // Fetch profile names for reported_by and sent_by
  const profileIds = new Set<string>()
  for (const v of violations) {
    if (v.reported_by) profileIds.add(v.reported_by)
  }
  for (const l of letters) {
    if (l.sent_by) profileIds.add(l.sent_by)
  }

  const profileNames = new Map<string, string>()
  if (profileIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(profileIds))
    for (const p of profiles || []) {
      profileNames.set(p.id, p.full_name || "Unknown")
    }
  }

  for (const v of violations) {
    v.reported_by_name = v.reported_by
      ? profileNames.get(v.reported_by) || null
      : null
  }
  for (const l of letters) {
    l.sent_by_name = l.sent_by
      ? profileNames.get(l.sent_by) || null
      : null
  }

  return {
    property: propertyRes.data as Property,
    currentResidents: residents.filter((r) => r.is_current),
    formerResidents: residents.filter((r) => !r.is_current),
    violations,
    letters,
    payments: (paymentsRes.data || []) as Payment[],
  }
}
