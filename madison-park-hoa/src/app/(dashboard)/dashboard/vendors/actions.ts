"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createVendor(formData: FormData) {
  const supabase = createClient()

  const data = {
    company_name: formData.get("company_name") as string,
    contact_name: (formData.get("contact_name") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    category: (formData.get("category") as string) || null,
    address: (formData.get("address") as string) || null,
    license_number: (formData.get("license_number") as string) || null,
    insurance_expiry: (formData.get("insurance_expiry") as string) || null,
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
    notes: (formData.get("notes") as string) || null,
    is_active: true,
  }

  const { error } = await supabase.from("vendors").insert(data)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors")
  return { error: null }
}

export async function updateVendor(id: string, updates: Record<string, unknown>) {
  const supabase = createClient()

  const { error } = await supabase.from("vendors").update(updates).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors")
  return { error: null }
}

export async function updateVendorRating(id: string, rating: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from("vendors")
    .update({ rating })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors")
  return { error: null }
}

export async function updateVendorNotes(id: string, notes: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("vendors")
    .update({ notes })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors")
  return { error: null }
}

export async function toggleVendorActive(id: string, is_active: boolean) {
  const supabase = createClient()

  const { error } = await supabase
    .from("vendors")
    .update({ is_active })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/vendors")
  return { error: null }
}
