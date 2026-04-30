"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

function propertyPaths(slug: string, propertyId: string) {
  return [
    tenantPath(slug, "properties", propertyId),
    tenantPath(slug, "properties"),
  ]
}

export async function updatePropertyStatus(
  propertyId: string,
  status: string
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("properties")
    .update({ status })
    .eq("id", propertyId)

  if (error) return { error: error.message }

  await audit.log({
    action: "property.update_status",
    entity: "properties",
    entityId: propertyId,
    metadata: { status },
  })

  revalidatePath(tenantPath(tenantSlug, "properties", propertyId))
  return { error: null }
}

export async function updatePropertyNotes(
  propertyId: string,
  notes: string
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("properties")
    .update({ notes })
    .eq("id", propertyId)

  if (error) return { error: error.message }

  await audit.log({
    action: "property.update_notes",
    entity: "properties",
    entityId: propertyId,
  })

  revalidatePath(tenantPath(tenantSlug, "properties", propertyId))
  return { error: null }
}

export async function addResident(formData: FormData) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const firstName = (formData.get("first_name") as string) || ""
  const lastName = (formData.get("last_name") as string) || ""
  const fullName = `${firstName} ${lastName}`.trim()
  const relationship = (formData.get("relationship") as string) || "Primary Owner"

  // Write both old and new columns for backward compatibility
  const data: Record<string, unknown> = {
    tenant_id: tenantId,
    property_id: formData.get("property_id") as string,
    full_name: fullName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    type: mapRelationshipToType(relationship),
    move_in_date: (formData.get("move_in_date") as string) || null,
    is_current: true,
    notes: (formData.get("notes") as string) || null,
  }

  // Try to set new columns — will be ignored if migration not yet applied
  try {
    const testResult = await supabase
      .from("residents")
      .select("first_name")
      .limit(0)
    if (!testResult.error) {
      data.first_name = firstName
      data.last_name = lastName
      data.relationship = relationship
      data.status = "active"
    }
  } catch {
    // New columns not available yet, skip
  }

  const { data: row, error } = await supabase
    .from("residents")
    .insert(data)
    .select("id")
    .single()
  if (error) return { error: error.message }

  await audit.log({
    action: "resident.create",
    entity: "residents",
    entityId: row?.id,
    metadata: { property_id: data.property_id, relationship },
  })

  for (const p of propertyPaths(tenantSlug, data.property_id as string)) {
    revalidatePath(p)
  }
  return { error: null }
}

export async function updateResident(
  residentId: string,
  propertyId: string,
  formData: FormData
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const firstName = (formData.get("first_name") as string) || ""
  const lastName = (formData.get("last_name") as string) || ""
  const fullName = `${firstName} ${lastName}`.trim()
  const relationship = (formData.get("relationship") as string) || "Primary Owner"

  const data: Record<string, unknown> = {
    full_name: fullName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    type: mapRelationshipToType(relationship),
    move_in_date: (formData.get("move_in_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  }

  // Try to set new columns
  try {
    const testResult = await supabase
      .from("residents")
      .select("first_name")
      .limit(0)
    if (!testResult.error) {
      data.first_name = firstName
      data.last_name = lastName
      data.relationship = relationship
    }
  } catch {
    // New columns not available yet, skip
  }

  const { error } = await supabase
    .from("residents")
    .update(data)
    .eq("id", residentId)
  if (error) return { error: error.message }

  await audit.log({
    action: "resident.update",
    entity: "residents",
    entityId: residentId,
    metadata: { property_id: propertyId, relationship },
  })

  for (const p of propertyPaths(tenantSlug, propertyId)) {
    revalidatePath(p)
  }
  return { error: null }
}

export async function moveOutResident(
  residentId: string,
  propertyId: string
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const today = new Date().toISOString().slice(0, 10)

  const data: Record<string, unknown> = {
    is_current: false,
    move_out_date: today,
  }

  // Try to set new status column
  try {
    const testResult = await supabase
      .from("residents")
      .select("status")
      .limit(0)
    if (!testResult.error) {
      data.status = "former"
    }
  } catch {
    // New column not available yet, skip
  }

  const { error } = await supabase
    .from("residents")
    .update(data)
    .eq("id", residentId)

  if (error) return { error: error.message }

  await audit.log({
    action: "resident.move_out",
    entity: "residents",
    entityId: residentId,
    metadata: { property_id: propertyId, move_out_date: today },
  })

  for (const p of propertyPaths(tenantSlug, propertyId)) {
    revalidatePath(p)
  }
  return { error: null }
}

export async function recordPayment(formData: FormData) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const data = {
    tenant_id: tenantId,
    property_id: formData.get("property_id") as string,
    resident_id: (formData.get("resident_id") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    due_date: (formData.get("due_date") as string) || null,
    paid_date: (formData.get("paid_date") as string) || null,
    payment_method: (formData.get("payment_method") as string) || null,
    status: (formData.get("status") as string) || "pending",
    period: (formData.get("period") as string) || null,
    notes: (formData.get("notes") as string) || null,
  }

  const { data: row, error } = await supabase
    .from("payments")
    .insert(data)
    .select("id")
    .single()
  if (error) return { error: error.message }

  await audit.log({
    action: "payment.create",
    entity: "payments",
    entityId: row?.id,
    metadata: {
      property_id: data.property_id,
      amount: data.amount,
      status: data.status,
    },
  })

  revalidatePath(tenantPath(tenantSlug, "properties", data.property_id))
  return { error: null }
}

function mapRelationshipToType(relationship: string | null): string {
  switch (relationship) {
    case "Primary Owner":
    case "Spouse":
      return "owner"
    case "Co-Owner":
      return "co-owner"
    case "Tenant":
      return "tenant"
    default:
      return "owner"
  }
}
