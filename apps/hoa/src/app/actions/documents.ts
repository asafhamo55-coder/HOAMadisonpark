"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const BUCKET = "documents"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]
const DELETE_ROLES: TenantRole[] = ["owner", "admin"]

export async function uploadDocument(formData: FormData) {
  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  if (!WRITE_ROLES.includes(role)) return { error: "Forbidden" }

  const file = formData.get("file") as File | null
  const title = formData.get("title") as string
  const category = formData.get("category") as string
  const isPublic = formData.get("is_public") === "true"

  if (!file || !file.size) return { error: "No file provided" }
  if (!title) return { error: "Title is required" }

  // Storage path is namespaced under <tenant_id>/<category>/...
  // Stream A's storage policies clamp reads/writes to that prefix.
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()
  const storagePath = `${tenantId}/${category}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  // Get public URL (bucket is public per legacy app; ACL enforced via
  // is_public flag + tenant-scoped storage policies).
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  // Save record (tenant_id added explicitly for defense-in-depth)
  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      title,
      category,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      is_public: isPublic,
      uploaded_by: userId,
    })
    .select("id")
    .single()

  if (dbError) return { error: dbError.message }

  await audit.log({
    action: "document.upload",
    entity: "documents",
    entityId: data?.id,
    metadata: {
      title,
      category,
      file_name: file.name,
      file_size: file.size,
      is_public: isPublic,
      storage_path: storagePath,
    },
  })

  revalidatePath(tenantPath(tenantSlug, "documents"))
  return { error: null }
}

export async function deleteDocument(id: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  if (!DELETE_ROLES.includes(role)) {
    return { error: "Only admins can delete documents" }
  }

  // Get the document to find the storage path
  const { data: doc } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .single()

  if (doc?.file_url) {
    // Extract storage path from URL
    const urlParts = doc.file_url.split(`/storage/v1/object/public/${BUCKET}/`)
    if (urlParts[1]) {
      await supabase.storage
        .from(BUCKET)
        .remove([decodeURIComponent(urlParts[1])])
    }
  }

  const { error } = await supabase.from("documents").delete().eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "document.delete",
    entity: "documents",
    entityId: id,
  })

  revalidatePath(tenantPath(tenantSlug, "documents"))
  return { error: null }
}

export async function toggleDocumentVisibility(id: string, isPublic: boolean) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  if (!WRITE_ROLES.includes(role)) return { error: "Forbidden" }

  const { error } = await supabase
    .from("documents")
    .update({ is_public: isPublic })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "document.toggle_visibility",
    entity: "documents",
    entityId: id,
    metadata: { is_public: isPublic },
  })

  revalidatePath(tenantPath(tenantSlug, "documents"))
  return { error: null }
}
