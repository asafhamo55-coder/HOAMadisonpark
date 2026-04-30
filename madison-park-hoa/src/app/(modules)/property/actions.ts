"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"

const propertySchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  property_type: z.enum(["single_family", "multi_family", "condo", "townhouse", "commercial", "mixed_use"]).default("single_family"),
})

export async function createPropertyAction(formData: FormData) {
  const ws = await requireWorkspaceWithModule("property")
  const parsed = propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city") || null,
    state: formData.get("state") || null,
    zip: formData.get("zip") || null,
    property_type: formData.get("property_type") || "single_family",
  })
  if (!parsed.success) return { error: "Please fill in name and address." }

  const supabase = createClient()
  const { error } = await supabase.from("pm_properties").insert({ ...parsed.data, workspace_id: ws.id })
  if (error) return { error: error.message }
  revalidatePath("/property/properties")
  revalidatePath("/property")
  return { ok: true }
}

const tenantSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
})

export async function createTenantAction(formData: FormData) {
  const ws = await requireWorkspaceWithModule("property")
  const parsed = tenantSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
  })
  if (!parsed.success) return { error: "Tenant name is required." }

  const supabase = createClient()
  const { error } = await supabase.from("pm_tenants").insert({
    workspace_id: ws.id,
    full_name: parsed.data.full_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
  })
  if (error) return { error: error.message }
  revalidatePath("/property/tenants")
  return { ok: true }
}
