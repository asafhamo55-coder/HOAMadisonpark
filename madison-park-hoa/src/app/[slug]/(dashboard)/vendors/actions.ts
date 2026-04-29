"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export async function createVendor(formData: FormData) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const data = {
    tenant_id: tenantId,
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

  const { data: row, error } = await supabase
    .from("vendors")
    .insert(data)
    .select("id")
    .single()
  if (error) return { error: error.message }

  await audit.log({
    action: "vendor.create",
    entity: "vendors",
    entityId: row?.id,
    metadata: { company_name: data.company_name, category: data.category },
  })

  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}

export async function updateVendor(id: string, updates: Record<string, unknown>) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase.from("vendors").update(updates).eq("id", id)
  if (error) return { error: error.message }

  await audit.log({
    action: "vendor.update",
    entity: "vendors",
    entityId: id,
    metadata: updates,
  })

  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}

export async function updateVendorRating(id: string, rating: number) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("vendors")
    .update({ rating })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "vendor.update_rating",
    entity: "vendors",
    entityId: id,
    metadata: { rating },
  })

  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}

export async function updateVendorNotes(id: string, notes: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("vendors")
    .update({ notes })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "vendor.update_notes",
    entity: "vendors",
    entityId: id,
  })

  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}

export async function toggleVendorActive(id: string, is_active: boolean) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("vendors")
    .update({ is_active })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "vendor.toggle_active",
    entity: "vendors",
    entityId: id,
    metadata: { is_active },
  })

  revalidatePath(tenantPath(tenantSlug, "vendors"))
  return { error: null }
}
