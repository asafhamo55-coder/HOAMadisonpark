"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createWorkOrder(formData: FormData) {
  const supabase = createClient()

  const propertyId = formData.get("property_id") as string
  const data = {
    vendor_id: formData.get("vendor_id") as string,
    property_id: propertyId || null,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    scheduled_date: (formData.get("scheduled_date") as string) || null,
    cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    notes: (formData.get("notes") as string) || null,
    status: "requested",
  }

  const { error } = await supabase.from("vendor_jobs").insert(data)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors/jobs")
  revalidatePath("/dashboard/vendors")
  return { error: null }
}

export async function updateJobStatus(id: string, status: string) {
  const supabase = createClient()

  const updates: Record<string, unknown> = { status }
  if (status === "completed") {
    updates.completed_date = new Date().toISOString().slice(0, 10)
  }

  const { error } = await supabase.from("vendor_jobs").update(updates).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors/jobs")
  revalidatePath("/dashboard/vendors")
  return { error: null }
}
