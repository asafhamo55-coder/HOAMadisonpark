"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email/send"

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

  const headersList = headers()
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    headersList.get("origin") ||
    "http://localhost:3000"

  // 1. Try to create user in Supabase auth (no email sent by Supabase)
  let userId: string
  const { data: createData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role },
    })

  if (createError) {
    // If user already exists, look them up and re-invite
    if (
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("registered") ||
      createError.message.toLowerCase().includes("exists")
    ) {
      // Find existing user by email
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const existing = listData?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )
      if (!existing) {
        return { error: "User reportedly exists but could not be found. Try deleting first." }
      }
      userId = existing.id

      // Update their metadata with the new role
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { role },
        ban_duration: "none", // unban in case they were deactivated
      })
    } else {
      return { error: createError.message }
    }
  } else {
    userId = createData.user.id
  }

  // 2. Generate a recovery link so user can set their password
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=/set-password`,
      },
    })

  if (linkError) return { error: linkError.message }

  // 3. Build the invite URL from the generated link properties
  const tokenHash = linkData.properties?.hashed_token
  const inviteUrl = tokenHash
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${encodeURIComponent(`${origin}/auth/callback?next=/set-password`)}`
    : linkData.properties?.action_link || `${origin}/set-password`

  // 4. Send branded invitation email via Resend
  try {
    await sendEmail({
      to: email,
      template: "invitation",
      props: { role, inviteUrl },
    })
  } catch (emailErr) {
    return {
      error: `User created but email failed: ${(emailErr as Error).message}. You can delete and re-invite.`,
    }
  }

  // 5. Upsert profile entry
  await admin.from("profiles").upsert({
    id: userId,
    email,
    role,
  })

  await logAction(
    user.id,
    user.full_name || "Admin",
    `Invited user: ${email} as ${role}`,
    "profiles",
    userId
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

export async function deleteUser(userId: string) {
  const user = await requireAdmin()
  const admin = createAdminClient()

  if (userId === user.id) return { error: "Cannot delete yourself" }

  // Delete profile first (cascade will handle related records)
  await admin.from("profiles").delete().eq("id", userId)

  // Delete from Supabase auth
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  await logAction(
    user.id,
    user.full_name || "Admin",
    "Deleted user",
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
