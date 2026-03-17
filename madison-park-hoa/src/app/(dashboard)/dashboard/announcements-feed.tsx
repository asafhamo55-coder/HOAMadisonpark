"use client"

import { Megaphone, AlertTriangle, Calendar, Wrench, FileText, Pin } from "lucide-react"

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  general: { label: "General", color: "bg-blue-100 text-blue-800", icon: Megaphone },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  event: { label: "Event", color: "bg-purple-100 text-purple-800", icon: Calendar },
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800", icon: Wrench },
  policy: { label: "Policy", color: "bg-gray-100 text-gray-800", icon: FileText },
}

type FeedAnnouncement = {
  id: string
  title: string
  body: string
  type: string
  published_at: string
}

export function AnnouncementsFeed({
  announcements,
}: {
  announcements: FeedAnnouncement[]
}) {
  // Sort urgent to top
  const sorted = [...announcements].sort((a, b) => {
    if (a.type === "urgent" && b.type !== "urgent") return -1
    if (b.type === "urgent" && a.type !== "urgent") return 1
    return 0
  })

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Announcements</h2>
        <a
          href="/dashboard/announcements"
          className="text-xs text-blue-600 hover:underline"
        >
          View all
        </a>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No announcements at this time.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general
            const isUrgent = a.type === "urgent"
            return (
              <div
                key={a.id}
                className={`rounded-lg border p-3 ${
                  isUrgent ? "border-red-300 bg-red-50" : "bg-gray-50"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  {isUrgent && <Pin className="h-3 w-3 text-red-500" />}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tc.color}`}
                  >
                    {tc.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(a.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-medium leading-tight">
                  {a.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {a.body}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
