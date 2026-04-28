import { createClient } from "@/lib/supabase/server"
import { startOfMonth } from "date-fns"

export type ViolationRow = {
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
  // Joined fields
  property_address: string
  property_street: string | null
  resident_name: string | null
}

export type ViolationStats = {
  totalOpen: number
  noticesSent: number
  warningsSent: number
  unpaidFinesTotal: number
  resolvedThisMonth: number
}

export type PropertyOption = {
  id: string
  address: string
}

export type ResidentOption = {
  id: string
  full_name: string
  property_id: string
  email: string | null
  phone: string | null
  relationship: string | null
}

export type ViolationsPageData = {
  violations: ViolationRow[]
  stats: ViolationStats
  properties: PropertyOption[]
  residents: ResidentOption[]
}

export async function getViolationsPageData(): Promise<ViolationsPageData> {
  const supabase = createClient()

  const [violationsRes, propertiesRes, residentsRes] = await Promise.all([
    supabase
      .from("violations")
      .select("*")
      .order("reported_date", { ascending: false }),

    supabase
      .from("properties")
      .select("id, address, street")
      .order("address"),

    supabase
      .from("residents")
      .select("id, full_name, property_id, email, phone, relationship")
      .eq("is_current", true),
  ])

  const rawViolations = violationsRes.data || []
  const properties = (propertiesRes.data || []) as Array<{
    id: string
    address: string
    street: string | null
  }>
  const residents = (residentsRes.data || []) as ResidentOption[]

  // Build lookup maps
  const propertyMap = new Map(properties.map((p) => [p.id, p]))
  const residentMap = new Map(residents.map((r) => [r.id, r]))

  // Enrich violations
  const violations: ViolationRow[] = rawViolations.map((v) => {
    const prop = propertyMap.get(v.property_id)
    const res = v.resident_id ? residentMap.get(v.resident_id) : null
    return {
      ...v,
      property_address: prop?.address || "Unknown",
      property_street: prop?.street || null,
      resident_name: res?.full_name || null,
    }
  })

  // Compute stats
  const monthStart = startOfMonth(new Date()).toISOString().split("T")[0]

  const stats: ViolationStats = {
    totalOpen: violations.filter((v) => v.status === "open").length,
    noticesSent: violations.filter((v) => v.status === "notice_sent").length,
    warningsSent: violations.filter((v) => v.status === "warning_sent").length,
    unpaidFinesTotal: violations
      .filter((v) => v.fine_amount != null && !v.fine_paid)
      .reduce((sum, v) => sum + (v.fine_amount || 0), 0),
    resolvedThisMonth: violations.filter(
      (v) =>
        v.status === "resolved" &&
        v.resolved_date &&
        v.resolved_date >= monthStart
    ).length,
  }

  return {
    violations,
    stats,
    properties: properties.map(({ id, address }) => ({ id, address })),
    residents,
  }
}
