"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export async function updateEmailTemplate(
  id: string,
  updates: {
    subject_template?: string
    body_template?: string
    is_active?: boolean
  }
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("email_templates")
    .update(updates)
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "email_template.update",
    entity: "email_templates",
    entityId: id,
    metadata: updates,
  })

  revalidatePath(tenantPath(tenantSlug, "email"))
  return { error: null }
}

export async function createEmailTemplate(data: {
  name: string
  type: string
  subject_template: string
  body_template: string
}) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { data: row, error } = await supabase
    .from("email_templates")
    .insert({
      ...data,
      tenant_id: tenantId,
      is_active: true,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await audit.log({
    action: "email_template.create",
    entity: "email_templates",
    entityId: row?.id,
    metadata: { name: data.name, type: data.type },
  })

  revalidatePath(tenantPath(tenantSlug, "email"))
  return { error: null }
}

export async function toggleTemplateActive(id: string, is_active: boolean) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("email_templates")
    .update({ is_active })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "email_template.toggle_active",
    entity: "email_templates",
    entityId: id,
    metadata: { is_active },
  })

  revalidatePath(tenantPath(tenantSlug, "email"))
  return { error: null }
}
