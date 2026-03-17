"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const supabase = createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { error: error.message }
  return { error: null }
}

export async function getUnreadNotificationCount() {
  const user = await getCurrentUser()
  if (!user) return 0

  const supabase = createClient()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return count || 0
}
