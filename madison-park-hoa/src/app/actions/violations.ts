"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { violationFormSchema } from "@/lib/schemas/violation"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export async function createViolationAction(
  values: Record<string, unknown>,
  photoKeys: string[],
) {
  const parsed = violationFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  assertCanWrite(role)

  const form = parsed.data

  const { data: violation, error } = await supabase
    .from("violations")
    .insert({
      tenant_id: tenantId,
      property_id: form.property_id,
      resident_id: form.resident_id || null,
      category: form.category,
      severity: form.severity,
      description: form.description,
      reported_date: form.reported_date,
      due_date: form.due_date || null,
      notes: form.notes || null,
      photos: photoKeys.length > 0 ? photoKeys : null,
      reported_by: userId,
      status: form.auto_send_notice ? "notice_sent" : "open",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await audit.log({
    action: "violation.create",
    entity: "violations",
    entityId: violation?.id,
    metadata: {
      property_id: form.property_id,
      category: form.category,
      severity: form.severity,
      auto_send_notice: form.auto_send_notice,
      photo_count: photoKeys.length,
    },
  })

  // Note: per DECISIONS.md, AI summary on violations is dropped for v1.
  // The auto-send-notice email path stays a manual TODO for now since
  // the legacy app didn't actually wire it up.

  revalidatePath(tenantPath(tenantSlug, "violations"))
  revalidatePath(tenantPath(tenantSlug, "properties", form.property_id))
  return { error: null, violationId: violation?.id }
}

export async function uploadViolationPhotos(formData: FormData) {
  const { supabase, role, tenantId } = await requireTenantContext()
  assertCanWrite(role)

  const files = formData.getAll("photos") as File[]
  if (files.length === 0) return { keys: [], error: null }

  const uploadedKeys: string[] = []

  for (const file of files) {
    if (!file.size) continue

    const ext = file.name.split(".").pop() || "jpg"
    // Storage path scoped to <tenant_id>/violations/... per Stream A
    // storage policies.
    const key = `${tenantId}/violations/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("violations")
      .upload(key, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return {
        keys: [],
        error: `Failed to upload ${file.name}: ${error.message}`,
      }
    }

    uploadedKeys.push(key)
  }

  return { keys: uploadedKeys, error: null }
}

export async function updateViolationStatusAction(
  violationId: string,
  status: string,
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const updates: Record<string, unknown> = { status }
  if (status === "resolved") {
    updates.resolved_date = new Date().toISOString().split("T")[0]
  }

  const { error } = await supabase
    .from("violations")
    .update(updates)
    .eq("id", violationId)

  if (error) return { error: error.message }

  await audit.log({
    action: "violation.update_status",
    entity: "violations",
    entityId: violationId,
    metadata: { status },
  })

  revalidatePath(tenantPath(tenantSlug, "violations"))
  return { error: null }
}

export async function addFineAction(violationId: string, amount: number) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("violations")
    .update({
      fine_amount: amount,
      status: "fine_issued",
    })
    .eq("id", violationId)

  if (error) return { error: error.message }

  await audit.log({
    action: "violation.add_fine",
    entity: "violations",
    entityId: violationId,
    metadata: { amount },
  })

  revalidatePath(tenantPath(tenantSlug, "violations"))
  return { error: null }
}

export async function resolveViolationAction(violationId: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("violations")
    .update({
      status: "resolved",
      resolved_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", violationId)

  if (error) return { error: error.message }

  await audit.log({
    action: "violation.resolve",
    entity: "violations",
    entityId: violationId,
  })

  revalidatePath(tenantPath(tenantSlug, "violations"))
  return { error: null }
}
