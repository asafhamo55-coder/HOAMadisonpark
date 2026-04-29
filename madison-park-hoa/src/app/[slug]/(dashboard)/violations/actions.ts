"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function createViolation(formData: FormData) {
  const supabase = createClient()
  const user = await getCurrentUser()

  const data = {
    property_id: formData.get("property_id") as string,
    resident_id: (formData.get("resident_id") as string) || null,
    category: formData.get("category") as string,
    description: formData.get("description") as string,
    severity: (formData.get("severity") as string) || "medium",
    due_date: (formData.get("due_date") as string) || null,
    reported_by: user?.id || null,
    status: "open" as const,
  }

  const { error } = await supabase.from("violations").insert(data)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/violations")
  return { error: null }
}

export async function resolveViolation(violationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("violations")
    .update({
      status: "resolved",
      resolved_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", violationId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/violations")
  return { error: null }
}

export async function addFineToViolation(
  violationId: string,
  amount: number
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("violations")
    .update({
      fine_amount: amount,
      status: "fine_issued",
    })
    .eq("id", violationId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/violations")
  return { error: null }
}

export async function updateViolationStatus(
  violationId: string,
  status: string
) {
  const supabase = createClient()

  const updates: Record<string, unknown> = { status }
  if (status === "resolved") {
    updates.resolved_date = new Date().toISOString().split("T")[0]
  }

  const { error } = await supabase
    .from("violations")
    .update(updates)
    .eq("id", violationId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/violations")
  return { error: null }
}
