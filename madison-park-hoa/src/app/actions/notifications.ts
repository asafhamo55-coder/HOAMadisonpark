"use server"

import { requireTenantContext } from "@/lib/tenant"

/**
 * Notifications actions.
 *
 * Notifications belong to individual users (auth.users.id), so the
 * "tenant scope" is implicit — RLS clamps `notifications` rows to the
 * tenant we pin via `set_request_tenant()`. We still use
 * `requireTenantContext()` so that route resolution + membership are
 * verified before we read or mutate.
 */

export async function markAllNotificationsRead() {
  const { supabase, userId } = await requireTenantContext()

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) return { error: error.message }
  return { error: null }
}

export async function getUnreadNotificationCount() {
  const { supabase, userId } = await requireTenantContext()

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  return count || 0
}
