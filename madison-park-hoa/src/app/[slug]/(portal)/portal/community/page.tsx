import { createClient } from "@/lib/supabase/server"
import { CommunityView } from "./community-view"

export type CommunityAnnouncement = {
  id: string
  title: string
  body: string
  type: string
  published_at: string
}

export type CommunityDocument = {
  id: string
  title: string
  category: string | null
  file_url: string
  file_name: string | null
  file_size: number | null
  created_at: string
}

export default async function CommunityPage() {
  const supabase = createClient()

  const [announcementsRes, documentsRes, settingsRes] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, type, published_at, expires_at")
      .not("published_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("id, title, category, file_url, file_name, file_size, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("hoa_settings")
      .select("key, value")
      .eq("key", "hoa_profile")
      .single(),
  ])

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const announcements = (announcementsRes.data || [])
    .filter(
      (a: any) => !a.expires_at || new Date(a.expires_at) >= new Date()
    )
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      type: a.type,
      published_at: a.published_at,
    })) as CommunityAnnouncement[]
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const hoaProfile = (settingsRes.data?.value || {}) as {
    name?: string
    email?: string
    phone?: string
    address?: string
  }

  return (
    <CommunityView
      announcements={announcements}
      documents={(documentsRes.data || []) as CommunityDocument[]}
      hoaProfile={hoaProfile}
    />
  )
}
