"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

const BUCKET = "documents"

export async function uploadDocument(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const file = formData.get("file") as File | null
  const title = formData.get("title") as string
  const category = formData.get("category") as string
  const isPublic = formData.get("is_public") === "true"

  if (!file || !file.size) return { error: "No file provided" }
  if (!title) return { error: "Title is required" }

  const admin = createAdminClient()
  const supabase = createClient()

  // Upload to storage
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()
  const storagePath = `${category}/${Date.now()}-${safeName}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

  // Save record
  const { error: dbError } = await supabase.from("documents").insert({
    title,
    category,
    file_url: publicUrl,
    file_name: file.name,
    file_size: file.size,
    is_public: isPublic,
    uploaded_by: user.id,
  })

  if (dbError) return { error: dbError.message }

  revalidatePath("/dashboard/documents")
  return { error: null }
}

export async function deleteDocument(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    return { error: "Only admins can delete documents" }
  }

  const supabase = createClient()
  const admin = createAdminClient()

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
      await admin.storage.from(BUCKET).remove([decodeURIComponent(urlParts[1])])
    }
  }

  const { error } = await supabase.from("documents").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/documents")
  return { error: null }
}

export async function toggleDocumentVisibility(id: string, isPublic: boolean) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from("documents")
    .update({ is_public: isPublic })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/documents")
  return { error: null }
}
