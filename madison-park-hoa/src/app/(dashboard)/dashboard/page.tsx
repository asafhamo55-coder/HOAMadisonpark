import { createClient } from "@/lib/supabase/server"
import { AnnouncementsFeed } from "./announcements-feed"

export default async function DashboardPage() {
  const supabase = createClient()

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, type, published_at, expires_at")
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(5)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const announcements = (data || []).filter((a: any) => {
    if (!a.expires_at) return true
    return new Date(a.expires_at) >= new Date()
  }) as Array<{
    id: string
    title: string
    body: string
    type: string
    published_at: string
  }>

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <p className="text-muted-foreground">
          Overview of your community at a glance.
        </p>
      </div>
      <div>
        <AnnouncementsFeed announcements={announcements} />
      </div>
    </div>
  )
}
