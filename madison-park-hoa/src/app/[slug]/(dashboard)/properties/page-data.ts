import { createClient } from "@/lib/supabase/server"

export type ResidentSummary = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string
  relationship: string
  type: string
}

export type PropertyWithSummary = {
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
  status: "occupied" | "vacant" | "foreclosure" | "rental"
  notes: string | null
  created_at: string
  updated_at: string | null
  currentResidents: ResidentSummary[]
  openViolations: number
  overduePayments: number
}

export async function getPropertiesWithSummary(): Promise<
  PropertyWithSummary[]
> {
  const supabase = createClient()

  // Use is_current (original column) for filtering — works before and after migration
  const [propertiesResult, residentsResult, violationsResult, paymentsResult] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .order("address"),

      supabase
        .from("residents")
        .select("*")
        .eq("is_current", true),

      supabase
        .from("violations")
        .select("id, property_id")
        .in("status", [
          "open",
          "notice_sent",
          "warning_sent",
          "fine_issued",
        ]),

      supabase
        .from("payments")
        .select("id, property_id")
        .eq("status", "overdue"),
    ])

  const properties = propertiesResult.data || []
  const residents = residentsResult.data || []
  const violations = violationsResult.data || []
  const payments = paymentsResult.data || []

  // Group residents by property_id
  const residentsByProperty = new Map<string, ResidentSummary[]>()
  for (const r of residents) {
    const list = residentsByProperty.get(r.property_id) || []
    list.push({
      id: r.id,
      first_name: r.first_name ?? null,
      last_name: r.last_name ?? null,
      full_name: r.full_name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || "Unknown",
      relationship: r.relationship || r.type || "Primary Owner",
      type: r.type || "owner",
    })
    residentsByProperty.set(r.property_id, list)
  }

  // Count violations by property_id
  const violationCounts = new Map<string, number>()
  for (const v of violations) {
    violationCounts.set(v.property_id, (violationCounts.get(v.property_id) || 0) + 1)
  }

  // Count overdue payments by property_id
  const paymentCounts = new Map<string, number>()
  for (const p of payments) {
    paymentCounts.set(p.property_id, (paymentCounts.get(p.property_id) || 0) + 1)
  }

  return properties.map((prop) => ({
    id: prop.id,
    address: prop.address,
    address_line1: prop.address_line1 ?? prop.address,
    address_line2: prop.address_line2 ?? prop.unit ?? null,
    lot_number: prop.lot_number,
    street: prop.street,
    unit: prop.unit,
    zip: prop.zip,
    city: prop.city,
    state: prop.state,
    country: prop.country ?? "USA",
    property_type: prop.property_type ?? "Single Family",
    status: prop.status,
    notes: prop.notes,
    created_at: prop.created_at,
    updated_at: prop.updated_at ?? null,
    currentResidents: residentsByProperty.get(prop.id) || [],
    openViolations: violationCounts.get(prop.id) || 0,
    overduePayments: paymentCounts.get(prop.id) || 0,
  }))
}
