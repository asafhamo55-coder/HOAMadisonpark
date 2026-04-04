import { createClient } from "@/lib/supabase/server"

export type Resident = {
  id: string
  property_id: string
  profile_id: string | null
  first_name: string | null
  last_name: string | null
  full_name: string
  email: string | null
  phone: string | null
  relationship: string
  type: "owner" | "tenant" | "co-owner"
  status: "active" | "former"
  move_in_date: string | null
  move_out_date: string | null
  is_current: boolean
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  vehicles: string[] | null
  pets: string[] | null
  notes: string | null
  created_at: string
  updated_at: string | null
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
  address_line1: string | null
  address_line2: string | null
  lot_number: string | null
  street: string | null
  unit: string | null
  zip: string | null
  city: string | null
  state: string | null
  country: string | null
  property_type: string | null
  occupancy_type: "owner_occupied" | "rental"
  status: "occupied" | "vacant" | "foreclosure" | "rental"
  notes: string | null
  created_at: string
  updated_at: string | null
}

export type PropertyDetail = {
  property: Property
  currentResidents: Resident[]
  formerResidents: Resident[]
  violations: Violation[]
  letters: Letter[]
  payments: Payment[]
}

// Normalize a raw DB row into our Resident type (works before and after migration)
function normalizeResident(r: Record<string, unknown>): Resident {
  const fullName = (r.full_name as string) || ""
  return {
    id: r.id as string,
    property_id: r.property_id as string,
    profile_id: (r.profile_id as string) ?? null,
    first_name: (r.first_name as string) ?? null,
    last_name: (r.last_name as string) ?? null,
    full_name: fullName || `${(r.first_name as string) || ""} ${(r.last_name as string) || ""}`.trim() || "Unknown",
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    relationship: (r.relationship as string) || mapTypeToRelationship(r.type as string),
    type: (r.type as "owner" | "tenant" | "co-owner") || "owner",
    status: r.is_current === false ? "former" : ((r.status as "active" | "former") || "active"),
    move_in_date: (r.move_in_date as string) ?? null,
    move_out_date: (r.move_out_date as string) ?? null,
    is_current: r.is_current as boolean ?? true,
    emergency_contact_name: (r.emergency_contact_name as string) ?? null,
    emergency_contact_phone: (r.emergency_contact_phone as string) ?? null,
    vehicles: (r.vehicles as string[]) ?? null,
    pets: (r.pets as string[]) ?? null,
    notes: (r.notes as string) ?? null,
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? null,
  }
}

function mapTypeToRelationship(type: string | null): string {
  switch (type) {
    case "owner": return "Primary Owner"
    case "co-owner": return "Co-Owner"
    case "tenant": return "Tenant"
    default: return "Primary Owner"
  }
}

// Normalize a raw DB row into our Property type (works before and after migration)
function normalizeProperty(p: Record<string, unknown>): Property {
  return {
    id: p.id as string,
    address: p.address as string,
    address_line1: (p.address_line1 as string) ?? (p.address as string),
    address_line2: (p.address_line2 as string) ?? (p.unit as string) ?? null,
    lot_number: (p.lot_number as string) ?? null,
    street: (p.street as string) ?? null,
    unit: (p.unit as string) ?? null,
    zip: (p.zip as string) ?? null,
    city: (p.city as string) ?? null,
    state: (p.state as string) ?? null,
    country: (p.country as string) ?? "USA",
    property_type: (p.property_type as string) ?? "Single Family",
    occupancy_type: (p.occupancy_type as Property["occupancy_type"]) || "owner_occupied",
    status: (p.status as Property["status"]) || "occupied",
    notes: (p.notes as string) ?? null,
    created_at: p.created_at as string,
    updated_at: (p.updated_at as string) ?? null,
  }
}

export async function getPropertyDetail(
  id: string
): Promise<PropertyDetail | null> {
  const supabase = createClient()

  const [propertyRes, residentsRes, violationsRes, lettersRes, paymentsRes] =
    await Promise.all([
      supabase.from("properties").select("*").eq("id", id).single(),

      // Use is_current for ordering — works before and after migration
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

  const rawResidents = (residentsRes.data || []) as Record<string, unknown>[]
  const residents = rawResidents.map(normalizeResident)
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

  const property = normalizeProperty(propertyRes.data as Record<string, unknown>)

  return {
    property,
    // Use is_current (original column) as the source of truth for active/former split
    currentResidents: residents.filter((r) => r.is_current),
    formerResidents: residents.filter((r) => !r.is_current),
    violations,
    letters,
    payments: (paymentsRes.data || []) as Payment[],
  }
}
