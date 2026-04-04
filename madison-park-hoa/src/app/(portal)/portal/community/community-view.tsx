"use client"

import Link from "next/link"
import {
  Megaphone,
  FileText,
  Pin,
  Download,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileImage,
  File as FileIcon,
  BookOpen,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CommunityAnnouncement, CommunityDocument } from "./page"

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  general: { label: "General", color: "bg-blue-100 text-blue-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
  event: { label: "Event", color: "bg-purple-100 text-purple-800" },
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },
  policy: { label: "Policy", color: "bg-gray-100 text-gray-800" },
}

const CATEGORY_LABELS: Record<string, string> = {
  rules_and_regulations: "Rules & Regulations",
  meeting_minutes: "Meeting Minutes",
  forms: "Forms",
  budgets: "Budgets",
  insurance: "Insurance",
  other: "Other",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(name: string | null) {
  if (!name) return FileIcon
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return FileText
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) return FileImage
  return FileIcon
}

export function CommunityView({
  announcements,
  documents,
  hoaProfile,
}: {
  announcements: CommunityAnnouncement[]
  documents: CommunityDocument[]
  hoaProfile: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
}) {
  // Sort urgent to top
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.type === "urgent" && b.type !== "urgent") return -1
    if (b.type === "urgent" && a.type !== "urgent") return 1
    return 0
  })

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold">Community</h1>

      {/* Announcements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-purple-600" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No announcements at this time.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedAnnouncements.map((a) => {
                const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general
                const isUrgent = a.type === "urgent"
                return (
                  <div
                    key={a.id}
                    className={`rounded-xl border p-4 ${
                      isUrgent
                        ? "border-red-300 bg-red-50 ring-1 ring-red-200"
                        : "bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {isUrgent && (
                        <Pin className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tc.color}`}
                      >
                        {tc.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(a.published_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                      {a.body}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Rules Link */}
      <Link href="/portal/rules">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Community Rules & Guidelines</p>
              <p className="text-xs text-muted-foreground">
                View pet policies, parking rules, architectural standards, leasing restrictions, and more
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-blue-600" />
            HOA Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents available.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const Icon = getFileIcon(doc.file_name)
                const catLabel =
                  CATEGORY_LABELS[doc.category || "other"] || "Other"
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {catLabel}
                          {doc.file_size
                            ? ` · ${formatFileSize(doc.file_size)}`
                            : ""}
                          {" · "}
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="shrink-0 rounded-md border px-3 py-1 text-xs font-medium hover:bg-gray-50"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Board Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Board Contact Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              {hoaProfile.name || "Madison Park HOA"}
            </p>
            {hoaProfile.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                {hoaProfile.address}
              </div>
            )}
            {hoaProfile.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <a
                  href={`mailto:${hoaProfile.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {hoaProfile.email}
                </a>
              </div>
            )}
            {hoaProfile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <a
                  href={`tel:${hoaProfile.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {hoaProfile.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              Office Hours: Mon–Fri, 9:00 AM – 5:00 PM
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
