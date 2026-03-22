"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

/* ── Helpers ──────────────────────────────────────────────── */

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized — admin only")
  }
  return user
}

async function requireAdminOrBoard() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    throw new Error("Unauthorized")
  }
  return user
}

async function logAction(
  userId: string,
  userName: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const supabase = createClient()
  await supabase.from("audit_log").insert({
    user_id: userId,
    user_name: userName,
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    details: details || null,
  })
}

/* ── HOA Profile ─────────────────────────────────────────── */

export async function getSettings(key: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("hoa_settings")
    .select("value")
    .eq("key", key)
    .single()
  return data?.value ?? null
}

export async function updateSettings(key: string, value: unknown) {
  const user = await requireAdmin()
  const supabase = createClient()

  const { error } = await supabase
    .from("hoa_settings")
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })

  if (error) return { error: error.message }

  await logAction(
    user.id,
    user.full_name || "Admin",
    `Updated settings: ${key}`,
    "hoa_settings",
    key
  )

  revalidatePath("/dashboard/settings")
  return { error: null }
}

/* ── Logo Upload ─────────────────────────────────────────── */

export async function uploadLogo(formData: FormData) {
  const user = await requireAdmin()
  const admin = createAdminClient()
  const file = formData.get("logo") as File | null

  if (!file || !file.size) return { error: "No file provided" }

  const ext = file.name.split(".").pop() || "png"
  const storagePath = `branding/logo-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = admin.storage.from("documents").getPublicUrl(storagePath)

  // Update hoa_profile setting with new logo URL
  const supabase = createClient()
  const { data: current } = await supabase
    .from("hoa_settings")
    .select("value")
    .eq("key", "hoa_profile")
    .single()

  const profile = (current?.value as Record<string, unknown>) || {}
  profile.logo_url = publicUrl

  await supabase.from("hoa_settings").upsert({
    key: "hoa_profile",
    value: profile,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  })

  await logAction(
    user.id,
    user.full_name || "Admin",
    "Uploaded HOA logo",
    "hoa_settings",
    "hoa_profile"
  )

  revalidatePath("/dashboard/settings")
  return { error: null, url: publicUrl }
}

/* ── User Management ─────────────────────────────────────── */

export async function getAllProfiles() {
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("full_name", { ascending: true })
  return data || []
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "board" | "resident" | "vendor"
) {
  const user = await requireAdmin()
  const supabase = createClient()

  if (userId === user.id) return { error: "Cannot change your own role" }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) return { error: error.message }

  await logAction(
    user.id,
    user.full_name || "Admin",
    `Changed user role to ${role}`,
    "profiles",
    userId
  )

  revalidatePath("/dashboard/settings")
  return { error: null }
}

export async function inviteUser(email: string, role: string) {
  const user = await requireAdmin()
  const admin = createAdminClient()

  // Use Supabase admin to invite user via magic link
  // Redirect to /auth/callback which exchanges the code, then to /set-password
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/set-password`,
  })

  if (error) return { error: error.message }

  // Create profile entry
  if (data.user) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      role,
    })
  }

  await logAction(
    user.id,
    user.full_name || "Admin",
    `Invited user: ${email} as ${role}`,
    "profiles",
    data.user?.id
  )

  revalidatePath("/dashboard/settings")
  return { error: null }
}

export async function deactivateUser(userId: string) {
  const user = await requireAdmin()
  const admin = createAdminClient()

  if (userId === user.id) return { error: "Cannot deactivate yourself" }

  // Ban the user using Supabase admin
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h", // ~100 years
  })

  if (error) return { error: error.message }

  await logAction(
    user.id,
    user.full_name || "Admin",
    "Deactivated user",
    "profiles",
    userId
  )

  revalidatePath("/dashboard/settings")
  return { error: null }
}

/* ── Audit Log ───────────────────────────────────────────── */

export async function getAuditLog(limit = 50) {
  await requireAdminOrBoard()
  const supabase = createClient()
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data || []
}
