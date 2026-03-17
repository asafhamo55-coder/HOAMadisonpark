"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email/send"

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
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const published_at = input.publish_now ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title,
      body: input.body,
      type: input.type,
      send_email: input.send_email,
      published_at,
      expires_at: input.expires_at || null,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // If publish now and send email, broadcast immediately
  if (input.publish_now && input.send_email && data) {
    const emailResult = await sendAnnouncementEmail(data.id)
    if (emailResult.error) {
      // Announcement created, but email failed — report partial success
      revalidatePath("/dashboard/announcements")
      revalidatePath("/dashboard")
      return { error: null, emailError: emailResult.error, id: data.id }
    }
  }

  revalidatePath("/dashboard/announcements")
  revalidatePath("/dashboard")
  return { error: null, id: data.id }
}

export async function publishAnnouncement(id: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("announcements")
    .update({ published_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/announcements")
  revalidatePath("/dashboard")
  return { error: null }
}

export async function unpublishAnnouncement(id: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("announcements")
    .update({ published_at: null })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/announcements")
  revalidatePath("/dashboard")
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
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/announcements")
  revalidatePath("/dashboard")
  return { error: null }
}

export async function deleteAnnouncement(id: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/announcements")
  revalidatePath("/dashboard")
  return { error: null }
}

export async function sendAnnouncementEmail(announcementId: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized", sent: 0 }
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

  let sent = 0
  const errors: string[] = []

  for (const resident of residents) {
    if (!resident.email) continue
    try {
      await sendEmail({
        to: resident.email,
        subject: `${announcement.title} — Madison Park HOA`,
        template: "general-announcement",
        props: {
          subject: announcement.title,
          body: announcement.body,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          fromName: "Madison Park HOA Board",
        },
      })
      sent++
    } catch (e) {
      errors.push(
        `${resident.email}: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }
  }

  // Mark announcement as email-sent
  await supabase
    .from("announcements")
    .update({ send_email: true })
    .eq("id", announcementId)

  revalidatePath("/dashboard/announcements")

  return {
    error: errors.length > 0 ? `${errors.length} emails failed` : null,
    sent,
    total: residents.length,
  }
}

export async function getResidentCount() {
  const supabase = createClient()
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["resident", "admin", "board"])
    .not("email", "is", null)

  return count || 0
}
