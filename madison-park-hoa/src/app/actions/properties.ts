"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export type AddPropertyInput = {
  address: string
  lot_number?: string
  street?: string
  unit?: string
  zip?: string
  city?: string
  state?: string
  status: "occupied" | "vacant" | "foreclosure" | "rental"
  notes?: string
}

export async function addPropertyAction(input: AddPropertyInput) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Not authorized" }
  }

  if (!input.address.trim()) {
    return { error: "Address is required" }
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("properties")
    .insert({
      address: input.address.trim(),
      lot_number: input.lot_number?.trim() || null,
      street: input.street?.trim() || null,
      unit: input.unit?.trim() || null,
      zip: input.zip?.trim() || "30022",
      city: input.city?.trim() || "Johns Creek",
      state: input.state?.trim() || "GA",
      status: input.status,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/properties")
  return { error: null, id: data.id }
}
