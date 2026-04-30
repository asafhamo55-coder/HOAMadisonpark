"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireTenantModule } from "@/lib/modules"
import { tenantPath } from "@/lib/tenant-path"

const propertySchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  property_type: z
    .enum(["single_family", "multi_family", "condo", "townhouse", "commercial", "mixed_use"])
    .default("single_family"),
})

export async function createPmPropertyAction(formData: FormData) {
  const ctx = await requireTenantModule("property")
  const parsed = propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city") || null,
    state: formData.get("state") || null,
    zip: formData.get("zip") || null,
    property_type: formData.get("property_type") || "single_family",
  })
  if (!parsed.success) return { error: "Please fill in name and address." }

  const { error } = await ctx.supabase.from("pm_properties").insert({
    ...parsed.data,
    tenant_id: ctx.tenantId,
  })
  if (error) return { error: error.message }
  revalidatePath(tenantPath(ctx.tenantSlug, "property", "properties"))
  revalidatePath(tenantPath(ctx.tenantSlug, "property"))
  return { ok: true }
}
