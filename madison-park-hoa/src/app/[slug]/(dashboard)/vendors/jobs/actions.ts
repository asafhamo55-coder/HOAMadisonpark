"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export async function createWorkOrder(formData: FormData) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const propertyId = formData.get("property_id") as string
  const data = {
    tenant_id: tenantId,
    vendor_id: formData.get("vendor_id") as string,
    property_id: propertyId || null,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    scheduled_date: (formData.get("scheduled_date") as string) || null,
    cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    notes: (formData.get("notes") as string) || null,
    status: "requested",
  }

  const { data: row, error } = await supabase
    .from("vendor_jobs")
    .insert(data)
    .select("id")
    .single()
  if (error) return { error: error.message }

  await audit.log({
    action: "vendor_job.create",
    entity: "vendor_jobs",
    entityId: row?.id,
    metadata: { vendor_id: data.vendor_id, property_id: propertyId || null },
  })

  revalidatePath(tenantPath(tenantSlug, "vendors", "jobs"))
  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}

export async function updateJobStatus(id: string, status: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const updates: Record<string, unknown> = { status }
  if (status === "completed") {
    updates.completed_date = new Date().toISOString().slice(0, 10)
  }

  const { error } = await supabase
    .from("vendor_jobs")
    .update(updates)
    .eq("id", id)
  if (error) return { error: error.message }

  await audit.log({
    action: "vendor_job.update_status",
    entity: "vendor_jobs",
    entityId: id,
    metadata: { status },
  })

  revalidatePath(tenantPath(tenantSlug, "vendors", "jobs"))
  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}
