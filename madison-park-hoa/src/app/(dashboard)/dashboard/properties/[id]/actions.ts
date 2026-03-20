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

  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string

  const data = {
    property_id: formData.get("property_id") as string,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    relationship: (formData.get("relationship") as string) || "Primary Owner",
    type: mapRelationshipToType(formData.get("relationship") as string),
    move_in_date: (formData.get("move_in_date") as string) || null,
    is_current: true,
    status: "active",
    notes: (formData.get("notes") as string) || null,
  }

  const { error } = await supabase.from("residents").insert(data)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${data.property_id}`)
  revalidatePath("/dashboard/properties")
  return { error: null }
}

export async function updateResident(
  residentId: string,
  propertyId: string,
  formData: FormData
) {
  const supabase = createClient()

  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string

  const data = {
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    relationship: (formData.get("relationship") as string) || "Primary Owner",
    type: mapRelationshipToType(formData.get("relationship") as string),
    move_in_date: (formData.get("move_in_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  }

  const { error } = await supabase
    .from("residents")
    .update(data)
    .eq("id", residentId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath("/dashboard/properties")
  return { error: null }
}

export async function moveOutResident(
  residentId: string,
  propertyId: string
) {
  const supabase = createClient()

  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase
    .from("residents")
    .update({
      status: "former",
      is_current: false,
      move_out_date: today,
    })
    .eq("id", residentId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath("/dashboard/properties")
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

function mapRelationshipToType(relationship: string | null): string {
  switch (relationship) {
    case "Primary Owner":
      return "owner"
    case "Co-Owner":
      return "co-owner"
    case "Tenant":
      return "tenant"
    case "Spouse":
      return "owner"
    default:
      return "owner"
  }
}
