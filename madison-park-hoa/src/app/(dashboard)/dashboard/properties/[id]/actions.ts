"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updatePropertyStatus(
  propertyId: string,
  status: string
) {
  const supabase = createClient()
  const { error } = await supabase
    .from("properties")
    .update({ status })
    .eq("id", propertyId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { error: null }
}

export async function updatePropertyNotes(
  propertyId: string,
  notes: string
) {
  const supabase = createClient()
  const { error } = await supabase
    .from("properties")
    .update({ notes })
    .eq("id", propertyId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { error: null }
}

export async function addResident(formData: FormData) {
  const supabase = createClient()

  const data = {
    property_id: formData.get("property_id") as string,
    full_name: formData.get("full_name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    type: (formData.get("type") as string) || "owner",
    move_in_date: (formData.get("move_in_date") as string) || null,
    is_current: true,
    vehicles: formData.get("vehicles")
      ? (formData.get("vehicles") as string)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : null,
    pets: formData.get("pets")
      ? (formData.get("pets") as string)
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : null,
  }

  const { error } = await supabase.from("residents").insert(data)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${data.property_id}`)
  return { error: null }
}

export async function updateResident(
  residentId: string,
  propertyId: string,
  formData: FormData
) {
  const supabase = createClient()

  const data = {
    full_name: formData.get("full_name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    type: (formData.get("type") as string) || "owner",
    move_in_date: (formData.get("move_in_date") as string) || null,
    vehicles: formData.get("vehicles")
      ? (formData.get("vehicles") as string)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : null,
    pets: formData.get("pets")
      ? (formData.get("pets") as string)
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : null,
  }

  const { error } = await supabase
    .from("residents")
    .update(data)
    .eq("id", residentId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { error: null }
}

export async function recordPayment(formData: FormData) {
  const supabase = createClient()

  const data = {
    property_id: formData.get("property_id") as string,
    resident_id: (formData.get("resident_id") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    due_date: (formData.get("due_date") as string) || null,
    paid_date: (formData.get("paid_date") as string) || null,
    payment_method: (formData.get("payment_method") as string) || null,
    status: (formData.get("status") as string) || "pending",
    period: (formData.get("period") as string) || null,
    notes: (formData.get("notes") as string) || null,
  }

  const { error } = await supabase.from("payments").insert(data)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${data.property_id}`)
  return { error: null }
}
