"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { sendEmail } from "@/lib/email/send"
import { loadTenantEmailContext } from "@/lib/email/tenant-email"
import { requireTenantContext } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"
import { createClient } from "@/lib/supabase/server"

/* ── Helpers ──────────────────────────────────────────────── */

async function getResidentContext() {
  const ctx = await requireTenantContext()

  // Find the resident's row scoped to the active tenant. RLS clamps
  // automatically; the explicit tenant_id filter is defense-in-depth.
  const { data: resident } = await ctx.supabase
    .from("residents")
    .select("id, property_id, properties(id, address)")
    .eq("profile_id", ctx.userId)
    .eq("tenant_id", ctx.tenantId)
    .eq("is_current", true)
    .limit(1)
    .single()

  return { ...ctx, resident }
}

/* ── Submit Request ──────────────────────────────────────── */

export async function submitRequest(formData: FormData) {
  const { supabase, tenantId, tenantSlug, userId, resident } =
    await getResidentContext()

  const type = formData.get("type") as string
  const subject = formData.get("subject") as string
  const description = formData.get("description") as string
  const expectedStart = formData.get("expected_start") as string | null
  const expectedEnd = formData.get("expected_end") as string | null

  if (!subject || !description)
    return { error: "Subject and description are required" }

  const { data: row, error } = await supabase
    .from("requests")
    .insert({
      tenant_id: tenantId,
      property_id: resident?.property_id || null,
      resident_id: resident?.id || null,
      submitted_by: userId,
      type,
      subject,
      description,
      expected_start: expectedStart || null,
      expected_end: expectedEnd || null,
      status: "submitted",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await audit.log({
    action: "request.submit",
    entity: "requests",
    entityId: row?.id,
    metadata: { type, subject, property_id: resident?.property_id || null },
  })

  // Send notification email to board
  try {
    const tenantEmail = await loadTenantEmailContext(supabase, tenantId)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const submitterName = user?.email ?? "A resident"

    await sendEmail({
      to: process.env.BOARD_EMAIL || tenantEmail.replyTo || tenantEmail.fromAddress,
      subject: `New ${type === "arc" ? "ARC" : "Maintenance"} Request: ${subject}`,
      template: "general-announcement",
      props: {
        subject: `New ${type === "arc" ? "ARC" : "Maintenance"} Request`,
        body: `${submitterName} has submitted a new ${type} request.\n\nSubject: ${subject}\n\nDescription: ${description}`,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        fromName: `${tenantEmail.name} Portal`,
      },
      tenant: tenantEmail,
    })
  } catch {
    // Email notification failed, but request was saved
  }

  revalidatePath(tenantPath(tenantSlug, "portal"))
  return { error: null }
}

export async function uploadRequestAttachments(formData: FormData) {
  const { supabase, tenantId } = await requireTenantContext()

  const files = formData.getAll("files") as File[]
  if (files.length === 0) return { keys: [], error: null }

  const uploadedKeys: string[] = []

  for (const file of files) {
    if (!file.size) continue

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase()
    // Storage path scoped to tenant prefix per Stream A's storage policies.
    const key = `${tenantId}/requests/${Date.now()}-${safeName}`

    const { error } = await supabase.storage
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
    } = supabase.storage.from("documents").getPublicUrl(key)

    uploadedKeys.push(publicUrl)
  }

  return { keys: uploadedKeys, error: null }
}

/* ── Account Updates ─────────────────────────────────────── */

export async function updateProfile(data: {
  phone?: string
  email?: string
}) {
  const { supabase, tenantSlug, userId } = await requireTenantContext()

  const updates: Record<string, unknown> = {}
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.email !== undefined) updates.email = data.email

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)

  if (error) return { error: error.message }

  await audit.log({
    action: "profile.update",
    entity: "profiles",
    entityId: userId,
    metadata: updates,
  })

  revalidatePath(tenantPath(tenantSlug, "portal", "account"))
  return { error: null }
}

export async function changePassword(newPassword: string) {
  // The auth flow uses the standard supabase client (not tenant-scoped):
  // updating a user's password is global, not tenant-scoped. We still
  // call requireTenantContext() to ensure the request came through a
  // resolved tenant route.
  await requireTenantContext()

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) return { error: error.message }

  await audit.log({
    action: "auth.change_password",
  })

  return { error: null }
}

export async function updateVehiclesAndPets(data: {
  vehicles: string[]
  pets: string[]
}) {
  const { supabase, tenantSlug, resident } = await getResidentContext()
  if (!resident) return { error: "No resident record found" }

  const { error } = await supabase
    .from("residents")
    .update({
      vehicles: data.vehicles.filter(Boolean),
      pets: data.pets.filter(Boolean),
    })
    .eq("id", resident.id)

  if (error) return { error: error.message }

  await audit.log({
    action: "resident.update_vehicles_pets",
    entity: "residents",
    entityId: resident.id,
    metadata: {
      vehicle_count: data.vehicles.filter(Boolean).length,
      pet_count: data.pets.filter(Boolean).length,
    },
  })

  revalidatePath(tenantPath(tenantSlug, "portal", "account"))
  return { error: null }
}
