"use server"

import { revalidatePath } from "next/cache"

import { withAdminClient } from "@/lib/admin"
import { audit } from "@/lib/audit"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const ADMIN_ROLES: TenantRole[] = ["owner", "admin"]
const READ_AUDIT_ROLES: TenantRole[] = ["owner", "admin", "board"]

/* ── Helpers ──────────────────────────────────────────────── */

async function requireAdminContext() {
  const ctx = await requireTenantContext()
  if (!ADMIN_ROLES.includes(ctx.role)) {
    throw new Error("Unauthorized — admin only")
  }
  return ctx
}

/* ── HOA Profile (legacy hoa_settings) ───────────────────── */

export async function getSettings(key: string) {
  const { supabase } = await requireTenantContext()
  const { data } = await supabase
    .from("hoa_settings")
    .select("value")
    .eq("key", key)
    .single()
  return data?.value ?? null
}

export async function updateSettings(key: string, value: unknown) {
  const { supabase, tenantId, tenantSlug, userId } = await requireAdminContext()

  const { error } = await supabase.from("hoa_settings").upsert({
    tenant_id: tenantId,
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  })

  if (error) return { error: error.message }

  await audit.log({
    action: "settings.update",
    entity: "hoa_settings",
    entityId: key,
    metadata: { key, value },
  })

  revalidatePath(tenantPath(tenantSlug, "settings"))
  return { error: null }
}

/* ── Logo Upload ─────────────────────────────────────────── */

export async function uploadLogo(formData: FormData) {
  const { supabase, tenantId, tenantSlug, userId } = await requireAdminContext()
  const file = formData.get("logo") as File | null

  if (!file || !file.size) return { error: "No file provided" }

  const ext = file.name.split(".").pop() || "png"
  // Storage path scoped to tenant prefix per Stream A storage policies.
  const storagePath = `${tenantId}/branding/logo-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from("documents").getPublicUrl(storagePath)

  // Update hoa_profile setting with new logo URL
  const { data: current } = await supabase
    .from("hoa_settings")
    .select("value")
    .eq("key", "hoa_profile")
    .single()

  const profile = (current?.value as Record<string, unknown>) || {}
  profile.logo_url = publicUrl

  await supabase.from("hoa_settings").upsert({
    tenant_id: tenantId,
    key: "hoa_profile",
    value: profile,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  })

  await audit.log({
    action: "settings.upload_logo",
    entity: "hoa_settings",
    entityId: "hoa_profile",
    metadata: { storage_path: storagePath },
  })

  revalidatePath(tenantPath(tenantSlug, "settings"))
  return { error: null, url: publicUrl }
}

/* ── User Management ─────────────────────────────────────── */

export async function getAllProfiles() {
  // Admin-only read of profiles for this tenant. RLS ensures we only
  // see profiles linked via tenant_memberships to the active tenant.
  await requireAdminContext()
  const { supabase, tenantId } = await requireTenantContext()

  // Pull memberships first, then join profiles.
  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("user_id, role, status")
    .eq("tenant_id", tenantId)

  const userIds = (memberships ?? []).map((m) => m.user_id)
  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .in("id", userIds)
    .order("full_name", { ascending: true })

  return profiles || []
}

export async function updateUserRole(
  userId: string,
  role: TenantRole,
) {
  const ctx = await requireAdminContext()
  if (userId === ctx.userId) return { error: "Cannot change your own role" }

  // Membership role is the source of truth for tenant access. We
  // update tenant_memberships.role rather than the global profiles.role.
  const { error: memberError } = await ctx.supabase
    .from("tenant_memberships")
    .update({ role })
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", userId)

  if (memberError) return { error: memberError.message }

  // Best-effort: keep the legacy profiles.role in sync for the existing
  // single-tenant UI bits that haven't been migrated yet.
  await ctx.supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  await audit.log({
    action: "membership.update_role",
    entity: "tenant_memberships",
    entityId: userId,
    metadata: { role },
  })

  revalidatePath(tenantPath(ctx.tenantSlug, "settings"))
  return { error: null }
}

export async function inviteUser(email: string, role: TenantRole) {
  const ctx = await requireAdminContext()

  // Inviting a user requires the service-role client because we may
  // be creating a new auth.users row. Goes through `withAdminClient`
  // so the operation is fully audited in `platform_audit_log`.
  const result = await withAdminClient(
    {
      action: "tenant.invite_user",
      reason: "admin invited new tenant member",
      tenantId: ctx.tenantId,
      entity: "tenant_memberships",
      metadata: { email, role },
    },
    async (admin) => {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { role, tenant_id: ctx.tenantId },
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }${tenantPath(ctx.tenantSlug)}`,
      })

      if (error) throw new Error(error.message)
      if (!data.user) throw new Error("Invite did not return a user")

      // Create profile entry (legacy single-tenant table).
      await admin.from("profiles").upsert({
        id: data.user.id,
        email,
        role,
      })

      // Create the tenant membership so the invite actually unlocks
      // access to this tenant. Stream A's invitation acceptance flow
      // also handles this; we set it up here as `invited` so the user
      // sees the tenant after accepting the email link.
      await admin.from("tenant_memberships").upsert(
        {
          tenant_id: ctx.tenantId,
          user_id: data.user.id,
          role,
          status: "invited",
          invited_by: ctx.userId,
        },
        { onConflict: "tenant_id,user_id" },
      )

      return data.user.id
    },
  )

  await audit.log({
    action: "membership.invite",
    entity: "tenant_memberships",
    entityId: result,
    metadata: { email, role },
  })

  revalidatePath(tenantPath(ctx.tenantSlug, "settings"))
  return { error: null }
}

export async function deactivateUser(userId: string) {
  const ctx = await requireAdminContext()
  if (userId === ctx.userId) return { error: "Cannot deactivate yourself" }

  // For multi-tenant safety we *suspend the membership* in this tenant
  // rather than ban the global auth user — they may still belong to
  // other tenants.
  const { error } = await ctx.supabase
    .from("tenant_memberships")
    .update({ status: "suspended" })
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", userId)

  if (error) return { error: error.message }

  await audit.log({
    action: "membership.suspend",
    entity: "tenant_memberships",
    entityId: userId,
  })

  revalidatePath(tenantPath(ctx.tenantSlug, "settings"))
  return { error: null }
}

/* ── Audit Log ───────────────────────────────────────────── */

export async function getAuditLog(limit = 50) {
  const ctx = await requireTenantContext()
  if (!READ_AUDIT_ROLES.includes(ctx.role)) {
    throw new Error("Unauthorized")
  }

  // RLS clamps audit_log to current_tenant_id() — no explicit filter.
  const { data } = await ctx.supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data || []
}
