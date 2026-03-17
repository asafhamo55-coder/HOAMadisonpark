"use client"

import { useState, useTransition } from "react"
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Pin,
  AlertTriangle,
  Calendar,
  Wrench,
  FileText,
  Megaphone,
} from "lucide-react"
import type { Announcement } from "./page"
import {
  createAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  sendAnnouncementEmail,
} from "@/app/actions/announcements"

const TYPES = ["general", "urgent", "event", "maintenance", "policy"] as const

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

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isExpired(a: Announcement) {
  if (!a.expires_at) return false
  return new Date(a.expires_at) < new Date()
}

/* ---------- New/Edit Announcement Modal ---------- */
function AnnouncementModal({
  announcement,
  residentCount,
  onClose,
}: {
  announcement?: Announcement
  residentCount: number
  onClose: () => void
}) {
  const isEdit = !!announcement
  const [title, setTitle] = useState(announcement?.title || "")
  const [body, setBody] = useState(announcement?.body || "")
  const [type, setType] = useState<(typeof TYPES)[number]>(
    announcement?.type || "general"
  )
  const [publishNow, setPublishNow] = useState(!isEdit)
  const [expiresAt, setExpiresAt] = useState(announcement?.expires_at?.slice(0, 10) || "")
  const [sendEmailChecked, setSendEmailChecked] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (isEdit) {
        await updateAnnouncement(announcement.id, {
          title,
          body,
          type,
          expires_at: expiresAt || null,
        })
      } else {
        await createAnnouncement({
          title,
          body,
          type,
          publish_now: publishNow,
          expires_at: expiresAt || null,
          send_email: sendEmailChecked,
        })
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as (typeof TYPES)[number])
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={6}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Write your announcement here..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Expiry Date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          {!isEdit && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  className="rounded"
                />
                Publish immediately
              </label>

              <div className="rounded-md border p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sendEmailChecked}
                    onChange={(e) => setSendEmailChecked(e.target.checked)}
                    className="rounded"
                  />
                  <Mail className="h-4 w-4" />
                  Send email to all residents
                </label>
                {sendEmailChecked && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This will send the announcement via the{" "}
                    <strong>general_announcement</strong> email template to{" "}
                    <strong>{residentCount}</strong> resident
                    {residentCount !== 1 && "s"}.
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create Announcement"}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ---------- Board View ---------- */
function BoardView({
  announcements,
  residentCount,
}: {
  announcements: Announcement[]
  residentCount: number
}) {
  const [showModal, setShowModal] = useState(false)
  const [editAnn, setEditAnn] = useState<Announcement | undefined>()
  const [pending, startTransition] = useTransition()

  function handleTogglePublish(a: Announcement) {
    startTransition(async () => {
      if (a.published_at) {
        await unpublishAnnouncement(a.id)
      } else {
        await publishAnnouncement(a.id)
      }
    })
  }

  function handleDelete(a: Announcement) {
    if (!confirm(`Delete "${a.title}"?`)) return
    startTransition(async () => {
      await deleteAnnouncement(a.id)
    })
  }

  function handleSendEmail(a: Announcement) {
    if (
      !confirm(
        `Send this announcement via email to all residents? This cannot be undone.`
      )
    )
      return
    startTransition(async () => {
      await sendAnnouncementEmail(a.id)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {announcements.length} announcement
          {announcements.length !== 1 && "s"}
        </p>
        <button
          onClick={() => {
            setEditAnn(undefined)
            setShowModal(true)
          }}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-muted-foreground">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No announcements yet.
                </td>
              </tr>
            ) : (
              announcements.map((a) => {
                const expired = isExpired(a)
                const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general
                return (
                  <tr key={a.id} className="border-b">
                    <td className="px-4 py-3 font-medium">
                      {a.type === "urgent" && (
                        <Pin className="mr-1 inline h-3 w-3 text-red-500" />
                      )}
                      {a.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tc.color}`}
                      >
                        {tc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expired ? (
                        <span className="text-xs font-medium text-red-600">
                          Expired
                        </span>
                      ) : a.published_at ? (
                        <span className="text-xs font-medium text-green-600">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-yellow-600">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.expires_at ? (
                        <span className={expired ? "text-red-600" : ""}>
                          {formatDate(a.expires_at)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePublish(a)}
                          disabled={pending}
                          className="rounded p-1 hover:bg-gray-100"
                          title={
                            a.published_at ? "Unpublish" : "Publish"
                          }
                        >
                          {a.published_at ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditAnn(a)
                            setShowModal(true)
                          }}
                          className="rounded p-1 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {!a.send_email && a.published_at && (
                          <button
                            onClick={() => handleSendEmail(a)}
                            disabled={pending}
                            className="rounded p-1 hover:bg-gray-100"
                            title="Send email to residents"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={pending}
                          className="rounded p-1 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AnnouncementModal
          announcement={editAnn}
          residentCount={residentCount}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

/* ---------- Resident View ---------- */
function ResidentView({ announcements }: { announcements: Announcement[] }) {
  // Filter out expired, sort urgent/pinned to top
  const visible = announcements
    .filter((a) => a.published_at && !isExpired(a))
    .sort((a, b) => {
      if (a.type === "urgent" && b.type !== "urgent") return -1
      if (b.type === "urgent" && a.type !== "urgent") return 1
      return (
        new Date(b.published_at!).getTime() -
        new Date(a.published_at!).getTime()
      )
    })

  if (visible.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No announcements at this time.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {visible.map((a) => {
        const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general
        const isUrgent = a.type === "urgent"
        return (
          <div
            key={a.id}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              isUrgent ? "border-red-300 ring-1 ring-red-200" : ""
            }`}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {isUrgent && <Pin className="h-4 w-4 text-red-500" />}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${tc.color}`}
                >
                  {tc.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(a.published_at)}
              </span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">{a.title}</h3>
            <p className="whitespace-pre-line text-sm text-gray-700">
              {a.body}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Main View ---------- */
export function AnnouncementsView({
  announcements,
  isBoardOrAdmin,
  residentCount,
}: {
  announcements: Announcement[]
  isBoardOrAdmin: boolean
  residentCount: number
}) {
  const [tab, setTab] = useState<"board" | "resident">(
    isBoardOrAdmin ? "board" : "resident"
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
      </div>

      {isBoardOrAdmin && (
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setTab("board")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "board"
                ? "bg-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Board View
          </button>
          <button
            onClick={() => setTab("resident")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "resident"
                ? "bg-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resident View
          </button>
        </div>
      )}

      {tab === "board" && isBoardOrAdmin ? (
        <BoardView
          announcements={announcements}
          residentCount={residentCount}
        />
      ) : (
        <ResidentView announcements={announcements} />
      )}
    </div>
  )
}
