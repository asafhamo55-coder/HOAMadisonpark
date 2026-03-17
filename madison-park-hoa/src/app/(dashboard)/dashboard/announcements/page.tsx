import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { AnnouncementsView } from "./announcements-view"

export type Announcement = {
  id: string
  title: string
  body: string
  type: "general" | "urgent" | "event" | "maintenance" | "policy"
  send_email: boolean
  published_at: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
}

export default async function AnnouncementsPage() {
  const supabase = createClient()
  const user = await getCurrentUser()
  const isBoardOrAdmin = user?.role === "admin" || user?.role === "board"

  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })

  // Residents only see published, non-expired announcements
  if (!isBoardOrAdmin) {
    query = query.not("published_at", "is", null)
  }

  const { data } = await query
  const announcements = (data || []) as Announcement[]

  // Get resident count for the email estimate
  let residentCount = 0
  if (isBoardOrAdmin) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["resident", "admin", "board"])
      .not("email", "is", null)
    residentCount = count || 0
  }

  return (
    <AnnouncementsView
      announcements={announcements}
      isBoardOrAdmin={isBoardOrAdmin}
      residentCount={residentCount}
    />
  )
}
