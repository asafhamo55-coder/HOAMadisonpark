"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email/send"

/* ── Helpers ──────────────────────────────────────────────── */

async function getResidentContext() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = createClient()
  const { data: resident } = await supabase
    .from("residents")
    .select("id, property_id, properties(id, address)")
    .eq("profile_id", user.id)
    .eq("is_current", true)
    .limit(1)
    .single()

  return { user, supabase, resident }
}

/* ── Submit Request ──────────────────────────────────────── */

export async function submitRequest(formData: FormData) {
  const { user, supabase, resident } = await getResidentContext()

  const type = formData.get("type") as string
  const subject = formData.get("subject") as string
  const description = formData.get("description") as string
  const expectedStart = formData.get("expected_start") as string | null
  const expectedEnd = formData.get("expected_end") as string | null

  if (!subject || !description) return { error: "Subject and description are required" }

  const { error } = await supabase.from("requests").insert({
    property_id: resident?.property_id || null,
    resident_id: resident?.id || null,
    submitted_by: user.id,
    type,
    subject,
    description,
    expected_start: expectedStart || null,
    expected_end: expectedEnd || null,
    status: "submitted",
  })

  if (error) return { error: error.message }

  // Send notification email to board
  try {
    await sendEmail({
      to: process.env.BOARD_EMAIL || "board@madisonparkhoa.com",
      subject: `New ${type === "arc" ? "ARC" : "Maintenance"} Request: ${subject}`,
      template: "general-announcement",
      props: {
        subject: `New ${type === "arc" ? "ARC" : "Maintenance"} Request`,
        body: `${user.full_name || "A resident"} has submitted a new ${type} request.\n\nSubject: ${subject}\n\nDescription: ${description}`,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        fromName: "Madison Park HOA Portal",
      },
    })
  } catch {
    // Email notification failed, but request was saved
  }

  revalidatePath("/portal")
  return { error: null }
}

export async function uploadRequestAttachments(formData: FormData) {
  const admin = createAdminClient()
  const files = formData.getAll("files") as File[]

  if (files.length === 0) return { keys: [], error: null }

  const uploadedKeys: string[] = []

  for (const file of files) {
    if (!file.size) continue

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase()
    const key = `requests/${Date.now()}-${safeName}`

    const { error } = await admin.storage
      .from("documents")
      .upload(key, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return { keys: [], error: `Failed to upload ${file.name}: ${error.message}` }
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("documents").getPublicUrl(key)

    uploadedKeys.push(publicUrl)
  }

  return { keys: uploadedKeys, error: null }
}

/* ── Account Updates ─────────────────────────────────────── */

export async function updateProfile(data: {
  phone?: string
  email?: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createClient()

  const updates: Record<string, unknown> = {}
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.email !== undefined) updates.email = data.email

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/portal/account")
  return { error: null }
}

export async function changePassword(newPassword: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateVehiclesAndPets(data: {
  vehicles: string[]
  pets: string[]
}) {
  const { supabase, resident } = await getResidentContext()
  if (!resident) return { error: "No resident record found" }

  const { error } = await supabase
    .from("residents")
    .update({
      vehicles: data.vehicles.filter(Boolean),
      pets: data.pets.filter(Boolean),
    })
    .eq("id", resident.id)

  if (error) return { error: error.message }

  revalidatePath("/portal/account")
  return { error: null }
}
