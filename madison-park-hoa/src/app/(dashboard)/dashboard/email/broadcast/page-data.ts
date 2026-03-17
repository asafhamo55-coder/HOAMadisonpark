import { createClient } from "@/lib/supabase/server"

export type BroadcastResident = {
  id: string
  full_name: string
  email: string | null
  type: "owner" | "tenant" | "co-owner"
  property_id: string
  property_address: string
  property_street: string | null
}

export type BroadcastPageData = {
  residents: BroadcastResident[]
  streets: string[]
}

export async function getBroadcastPageData(): Promise<BroadcastPageData> {
  const supabase = createClient()

  const [residentsRes, propertiesRes] = await Promise.all([
    supabase
      .from("residents")
      .select("id, full_name, email, type, property_id")
      .eq("is_current", true),

    supabase
      .from("properties")
      .select("id, address, street")
      .order("address"),
  ])

  const properties = (propertiesRes.data || []) as Array<{
    id: string
    address: string
    street: string | null
  }>
  const propertyMap = new Map(properties.map((p) => [p.id, p]))

  const residents: BroadcastResident[] = ((residentsRes.data || []) as Array<{
    id: string
    full_name: string
    email: string | null
    type: "owner" | "tenant" | "co-owner"
    property_id: string
  }>).map((r) => {
    const prop = propertyMap.get(r.property_id)
    return {
      ...r,
      property_address: prop?.address || "Unknown",
      property_street: prop?.street || null,
    }
  })

  const streets = Array.from(
    new Set(properties.map((p) => p.street).filter(Boolean) as string[])
  ).sort()

  return { residents, streets }
}
