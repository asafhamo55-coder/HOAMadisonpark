"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { violationFormSchema } from "@/lib/schemas/violation"

export async function createViolationAction(
  values: Record<string, unknown>,
  photoKeys: string[]
) {
  const parsed = violationFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createClient()
  const user = await getCurrentUser()
  const form = parsed.data

  const { data: violation, error } = await supabase
    .from("violations")
    .insert({
      property_id: form.property_id,
      resident_id: form.resident_id || null,
      category: form.category,
      severity: form.severity,
      description: form.description,
      reported_date: form.reported_date,
      due_date: form.due_date || null,
      notes: form.notes || null,
      photos: photoKeys.length > 0 ? photoKeys : null,
      reported_by: user?.id || null,
      status: form.auto_send_notice ? "notice_sent" : "open",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // TODO: If auto_send_notice, send email via Resend when email system is implemented
  // if (form.auto_send_notice && violation?.id) {
  //   await sendViolationNotice(violation.id)
  // }

  revalidatePath("/dashboard/violations")
  revalidatePath(`/dashboard/properties/${form.property_id}`)
  return { error: null, violationId: violation?.id }
}

export async function uploadViolationPhotos(formData: FormData) {
  const admin = createAdminClient()
  const files = formData.getAll("photos") as File[]

  if (files.length === 0) return { keys: [] as string[], error: null }

  const uploadedKeys: string[] = []

  for (const file of files) {
    if (!file.size) continue

    const ext = file.name.split(".").pop() || "jpg"
    const key = `violations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await admin.storage
      .from("violations")
      .upload(key, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return { keys: [] as string[], error: `Failed to upload ${file.name}: ${error.message}` }
    }

    uploadedKeys.push(key)
  }

  return { keys: uploadedKeys, error: null }
}

export async function uploadSingleViolationPhoto(formData: FormData) {
  const admin = createAdminClient()
  const file = formData.get("photo") as File | null

  if (!file || !file.size) return { key: "", error: "No file provided" }

  if (file.size > 10 * 1024 * 1024) {
    return { key: "", error: `${file.name} exceeds 10MB limit` }
  }

  const ext = file.name.split(".").pop() || "jpg"
  const key = `violations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await admin.storage
    .from("violations")
    .upload(key, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return { key: "", error: `Failed to upload ${file.name}: ${error.message}` }
  }

  return { key, error: null }
}

export async function updateViolationStatusAction(
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

export async function addFineAction(violationId: string, amount: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from("violations")
    .update({
      fine_amount: amount,
      status: "fine_issued",
    })
    .eq("id", violationId)

  if (error) return { error: error.message }

  // TODO: Send fine notice email via Resend when email system is implemented

  revalidatePath("/dashboard/violations")
  return { error: null }
}

export async function resolveViolationAction(violationId: string) {
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
