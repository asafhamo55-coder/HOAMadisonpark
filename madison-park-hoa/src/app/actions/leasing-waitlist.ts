"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export type WaitlistEntry = {
  id: string
  property_id: string
  property_address: string
  owner_name: string
  owner_email: string | null
  owner_phone: string | null
  reason: string | null
  status: string
  position: number | null
  requested_at: string
  approved_at: string | null
  notes: string | null
}

export type LeasingStats = {
  totalProperties: number
  openLeasingCount: number
  openLeasingPercent: number
  maxAllowed: number
  waitlistCount: number
  spotsAvailable: number
}

export async function getLeasingData(): Promise<{
  waitlist: WaitlistEntry[]
  stats: LeasingStats
}> {
  const supabase = createClient()

  const [propertiesRes, waitlistRes] = await Promise.all([
    supabase.from("properties").select("id, address, occupancy_type"),
    supabase
      .from("leasing_waitlist")
      .select("*")
      .eq("status", "waiting")
      .order("position", { ascending: true }),
  ])

  const properties = propertiesRes.data || []
  const totalProperties = properties.length
  const openLeasingCount = properties.filter(
    (p) => (p.occupancy_type as string) === "rental"
  ).length
  const maxAllowed = Math.floor(totalProperties * 0.15)
  const spotsAvailable = Math.max(0, maxAllowed - openLeasingCount)

  const propertyMap = new Map(
    properties.map((p) => [p.id, p.address as string])
  )

  const waitlist: WaitlistEntry[] = (waitlistRes.data || []).map((w) => ({
    id: w.id,
    property_id: w.property_id,
    property_address: propertyMap.get(w.property_id) || "Unknown",
    owner_name: w.owner_name,
    owner_email: w.owner_email,
    owner_phone: w.owner_phone,
    reason: w.reason,
    status: w.status,
    position: w.position,
    requested_at: w.requested_at,
    approved_at: w.approved_at,
    notes: w.notes,
  }))

  return {
    waitlist,
    stats: {
      totalProperties,
      openLeasingCount,
      openLeasingPercent:
        totalProperties > 0
          ? Math.round((openLeasingCount / totalProperties) * 100)
          : 0,
      maxAllowed,
      waitlistCount: waitlist.length,
      spotsAvailable,
    },
  }
}

export async function addToWaitlist(formData: FormData) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const propertyId = formData.get("property_id") as string
  const ownerName = formData.get("owner_name") as string
  const ownerEmail = (formData.get("owner_email") as string) || null
  const ownerPhone = (formData.get("owner_phone") as string) || null
  const reason = (formData.get("reason") as string) || null

  if (!propertyId || !ownerName) {
    return { error: "Property and owner name are required" }
  }

  // Check if already on waitlist
  const { data: existing } = await supabase
    .from("leasing_waitlist")
    .select("id")
    .eq("property_id", propertyId)
    .eq("status", "waiting")
    .single()

  if (existing) {
    return { error: "This property is already on the waitlist" }
  }

  // Get next position
  const { data: lastEntry } = await supabase
    .from("leasing_waitlist")
    .select("position")
    .eq("status", "waiting")
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (lastEntry?.position || 0) + 1

  const { error } = await supabase.from("leasing_waitlist").insert({
    property_id: propertyId,
    owner_name: ownerName,
    owner_email: ownerEmail,
    owner_phone: ownerPhone,
    reason,
    position: nextPosition,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/leasing")
  return { error: null }
}

export async function updateWaitlistEntry(id: string, formData: FormData) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const ownerName = formData.get("owner_name") as string
  const ownerEmail = (formData.get("owner_email") as string) || null
  const ownerPhone = (formData.get("owner_phone") as string) || null
  const reason = (formData.get("reason") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!ownerName) return { error: "Owner name is required" }

  const { error } = await supabase
    .from("leasing_waitlist")
    .update({
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      reason,
      notes,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/leasing")
  return { error: null }
}

export async function removeFromWaitlist(id: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("leasing_waitlist")
    .update({ status: "cancelled" })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/leasing")
  return { error: null }
}

export async function approveFromWaitlist(id: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  // Get the entry
  const { data: entry } = await supabase
    .from("leasing_waitlist")
    .select("property_id")
    .eq("id", id)
    .single()

  if (!entry) return { error: "Entry not found" }

  // Update property to rental
  await supabase
    .from("properties")
    .update({ occupancy_type: "rental" })
    .eq("id", entry.property_id)

  // Mark as approved
  const { error } = await supabase
    .from("leasing_waitlist")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/leasing")
  revalidatePath("/dashboard/properties")
  return { error: null }
}
