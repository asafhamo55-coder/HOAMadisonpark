"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

import { audit } from "@/lib/audit"
import { assertWithinLimit, LimitExceededError } from "@/lib/limits"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export type AddPropertyInput = {
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  country?: string
  property_type: string
  status: "occupied" | "vacant" | "foreclosure" | "rental"
  lot_number?: string
  notes?: string
}

export type EditPropertyInput = AddPropertyInput & {
  id: string
}

export async function addPropertyAction(input: AddPropertyInput) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  if (!input.address_line1.trim()) {
    return { error: "Street address is required" }
  }

  // Plan cap check (Stream D). Throws LimitExceededError if over cap.
  try {
    await assertWithinLimit(tenantId, "properties", 1)
  } catch (err) {
    if (err instanceof LimitExceededError) {
      return { error: err.message, limit: err.payload }
    }
    throw err
  }

  const address = [
    input.address_line1.trim(),
    input.address_line2?.trim(),
    `${input.city.trim()}, ${input.state.trim()} ${input.zip_code.trim()}`,
  ]
    .filter(Boolean)
    .join(", ")

  // Core payload uses original columns that always exist
  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    address,
    lot_number: input.lot_number?.trim() || null,
    unit: input.address_line2?.trim() || null,
    street: input.address_line1?.trim() || null,
    zip: input.zip_code.trim() || "30022",
    city: input.city.trim() || "Johns Creek",
    state: input.state.trim() || "GA",
    status: input.status,
    notes: input.notes?.trim() || null,
  }

  // Try to set new columns if migration has been applied
  const hasNewCols = await checkPropertyNewColumns(supabase)
  if (hasNewCols) {
    payload.address_line1 = input.address_line1.trim()
    payload.address_line2 = input.address_line2?.trim() || null
    payload.country = input.country?.trim() || "USA"
    payload.property_type = input.property_type || "Single Family"
  }

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id")
    .single()

  if (error) {
    console.error("[addPropertyAction] Supabase error:", error)
    return { error: error.message }
  }

  if (!data) {
    console.error("[addPropertyAction] No data returned – possible RLS denial")
    return { error: "Failed to create property. Please check your permissions." }
  }

  await audit.log({
    action: "property.create",
    entity: "properties",
    entityId: data.id,
    metadata: { address, status: input.status },
  })

  revalidatePath(tenantPath(tenantSlug, "properties"))
  return { error: null, id: data.id }
}

export async function editPropertyAction(input: EditPropertyInput) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  if (!input.address_line1.trim()) {
    return { error: "Street address is required" }
  }

  const address = [
    input.address_line1.trim(),
    input.address_line2?.trim(),
    `${input.city.trim()}, ${input.state.trim()} ${input.zip_code.trim()}`,
  ]
    .filter(Boolean)
    .join(", ")

  const payload: Record<string, unknown> = {
    address,
    lot_number: input.lot_number?.trim() || null,
    unit: input.address_line2?.trim() || null,
    street: input.address_line1?.trim() || null,
    zip: input.zip_code.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    status: input.status,
    notes: input.notes?.trim() || null,
  }

  const hasNewCols = await checkPropertyNewColumns(supabase)
  if (hasNewCols) {
    payload.address_line1 = input.address_line1.trim()
    payload.address_line2 = input.address_line2?.trim() || null
    payload.country = input.country?.trim() || "USA"
    payload.property_type = input.property_type
  }

  const { error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", input.id)

  if (error) {
    console.error("[editPropertyAction] Supabase error:", error)
    return { error: error.message }
  }

  await audit.log({
    action: "property.update",
    entity: "properties",
    entityId: input.id,
    metadata: { address, status: input.status },
  })

  revalidatePath(tenantPath(tenantSlug, "properties"))
  revalidatePath(tenantPath(tenantSlug, "properties", input.id))
  return { error: null }
}

export async function deletePropertyAction(id: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { count } = await supabase
    .from("residents")
    .select("id", { count: "exact", head: true })
    .eq("property_id", id)
    .eq("is_current", true)

  if (count && count > 0) {
    return {
      error: `This property has ${count} active resident(s). Please move them out before deleting.`,
    }
  }

  const { error } = await supabase.from("properties").delete().eq("id", id)

  if (error) {
    console.error("[deletePropertyAction] Supabase error:", error)
    return { error: error.message }
  }

  await audit.log({
    action: "property.delete",
    entity: "properties",
    entityId: id,
  })

  revalidatePath(tenantPath(tenantSlug, "properties"))
  return { error: null }
}

// Check if the migration has been applied by testing for a new column
async function checkPropertyNewColumns(
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const result = await supabase
      .from("properties")
      .select("address_line1")
      .limit(0)
    return !result.error
  } catch {
    return false
  }
}
