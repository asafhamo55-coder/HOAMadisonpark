"use server"

import { revalidatePath } from "next/cache"

import { audit } from "@/lib/audit"
import { sendEmail } from "@/lib/email/send"
import { loadTenantEmailContext } from "@/lib/email/tenant-email"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const WRITE_ROLES: TenantRole[] = ["owner", "admin", "board"]

function assertCanWrite(role: TenantRole) {
  if (!WRITE_ROLES.includes(role)) throw new Error("Forbidden")
}

export type AnnouncementInput = {
  title: string
  body: string
  type: "general" | "urgent" | "event" | "maintenance" | "policy"
  publish_now: boolean
  scheduled_date?: string | null
  expires_at?: string | null
  send_email: boolean
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  assertCanWrite(role)

  const published_at = input.publish_now ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      tenant_id: tenantId,
      title: input.title,
      body: input.body,
      type: input.type,
      send_email: input.send_email,
      published_at,
      expires_at: input.expires_at || null,
      created_by: userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await audit.log({
    action: "announcement.create",
    entity: "announcements",
    entityId: data.id,
    metadata: { type: input.type, publish_now: input.publish_now },
  })

  // If publish now and send email, broadcast immediately
  if (input.publish_now && input.send_email && data) {
    const emailResult = await sendAnnouncementEmail(data.id)
    if (emailResult.error) {
      revalidatePath(tenantPath(tenantSlug, "announcements"))
      revalidatePath(tenantPath(tenantSlug))
      return { error: null, emailError: emailResult.error, id: data.id }
    }
  }

  revalidatePath(tenantPath(tenantSlug, "announcements"))
  revalidatePath(tenantPath(tenantSlug))
  return { error: null, id: data.id }
}

export async function publishAnnouncement(id: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("announcements")
    .update({ published_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "announcement.publish",
    entity: "announcements",
    entityId: id,
  })

  revalidatePath(tenantPath(tenantSlug, "announcements"))
  revalidatePath(tenantPath(tenantSlug))
  return { error: null }
}

export async function unpublishAnnouncement(id: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("announcements")
    .update({ published_at: null })
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "announcement.unpublish",
    entity: "announcements",
    entityId: id,
  })

  revalidatePath(tenantPath(tenantSlug, "announcements"))
  revalidatePath(tenantPath(tenantSlug))
  return { error: null }
}

export async function updateAnnouncement(
  id: string,
  updates: {
    title?: string
    body?: string
    type?: string
    expires_at?: string | null
  }
) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "announcement.update",
    entity: "announcements",
    entityId: id,
    metadata: updates,
  })

  revalidatePath(tenantPath(tenantSlug, "announcements"))
  revalidatePath(tenantPath(tenantSlug))
  return { error: null }
}

export async function deleteAnnouncement(id: string) {
  const { supabase, role, tenantSlug } = await requireTenantContext()
  assertCanWrite(role)

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  await audit.log({
    action: "announcement.delete",
    entity: "announcements",
    entityId: id,
  })

  revalidatePath(tenantPath(tenantSlug, "announcements"))
  revalidatePath(tenantPath(tenantSlug))
  return { error: null }
}

export async function sendAnnouncementEmail(announcementId: string) {
  const { supabase, role, tenantId, tenantSlug } = await requireTenantContext()
  if (!WRITE_ROLES.includes(role)) {
    return { error: "Forbidden", sent: 0 }
  }

  // Fetch announcement
  const { data: announcement, error: annError } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .single()

  if (annError || !announcement) {
    return { error: "Announcement not found", sent: 0 }
  }

  // Fetch all current residents with email
  const { data: residents } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["resident", "admin", "board"])
    .not("email", "is", null)

  if (!residents || residents.length === 0) {
    return { error: "No recipients found", sent: 0 }
  }

  const tenantEmail = await loadTenantEmailContext(supabase, tenantId)

  let sent = 0
  const errors: string[] = []

  for (const resident of residents) {
    if (!resident.email) continue
    try {
      await sendEmail({
        to: resident.email,
        subject: `${announcement.title} — ${tenantEmail.name}`,
        template: "general-announcement",
        props: {
          subject: announcement.title,
          body: announcement.body,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          fromName: `${tenantEmail.name} Board`,
        },
        tenant: tenantEmail,
      })
      sent++
    } catch (e) {
      errors.push(
        `${resident.email}: ${e instanceof Error ? e.message : "Unknown error"}`,
      )
    }
  }

  // Mark announcement as email-sent
  await supabase
    .from("announcements")
    .update({ send_email: true })
    .eq("id", announcementId)

  await audit.log({
    action: "announcement.send_email",
    entity: "announcements",
    entityId: announcementId,
    metadata: { sent, total: residents.length, failed: errors.length },
  })

  revalidatePath(tenantPath(tenantSlug, "announcements"))

  return {
    error: errors.length > 0 ? `${errors.length} emails failed` : null,
    sent,
    total: residents.length,
  }
}

export async function getResidentCount() {
  const { supabase } = await requireTenantContext()
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["resident", "admin", "board"])
    .not("email", "is", null)

  return count || 0
}
