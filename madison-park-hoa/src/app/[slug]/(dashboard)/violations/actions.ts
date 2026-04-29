"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export async function createViolation(formData: FormData) {
  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  assertCanWrite(role)

  const data = {
    tenant_id: tenantId,
    property_id: formData.get("property_id") as string,
    resident_id: (formData.get("resident_id") as string) || null,
    category: formData.get("category") as string,
    description: formData.get("description") as string,
    severity: (formData.get("severity") as string) || "medium",
    due_date: (formData.get("due_date") as string) || null,
    reported_by: userId,
    status: "open" as const,
  }

  const { data: row, error } = await supabase
    .from("violations")
    .insert(data)
    .select("id")
    .single()
  if (error) return { error: error.message }

  await audit.log({
    action: "violation.create",
    entity: "violations",
    entityId: row?.id,
    metadata: {
      property_id: data.property_id,
      category: data.category,
      severity: data.severity,
    },
  })

  revalidatePath(tenantPath(tenantSlug, "violations"))
  return { error: null }
}

export async function resolveViolation(violationId: string) {
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

export async function addFineToViolation(
  violationId: string,
  amount: number
) {
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

export async function updateViolationStatus(
  violationId: string,
  status: string
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
