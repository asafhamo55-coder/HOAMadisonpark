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
  general: { label: "General", color: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/50" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 ring-1 ring-red-200/50" },
  event: { label: "Event", color: "bg-violet-100 text-violet-700 ring-1 ring-violet-200/50" },
  maintenance: { label: "Maintenance", color: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/50" },
  policy: { label: "Policy", color: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/50" },
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
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Community</h1>
        <p className="mt-1 text-sm text-slate-500">Stay up to date with announcements, documents, and community contacts.</p>
      </div>

      {/* Announcements */}
      <Card className="overflow-hidden rounded-xl border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
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
                    className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${
                      isUrgent
                        ? "border-red-200 bg-red-50/80 ring-1 ring-red-200/50"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {isUrgent && (
                        <Pin className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tc.color}`}
                      >
                        {tc.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(a.published_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#0f172a]">{a.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
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
        <Card className="group cursor-pointer overflow-hidden rounded-xl border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-200">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#0f172a]">Community Rules & Guidelines</p>
              <p className="text-xs text-slate-500">
                View pet policies, parking rules, architectural standards, leasing restrictions, and more
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-500" />
          </CardContent>
        </Card>
      </Link>

      {/* Documents */}
      <Card className="overflow-hidden rounded-xl border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              <FileText className="h-4 w-4 text-white" />
            </div>
            HOA Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
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
                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-indigo-100">
                        <Icon className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-[#0f172a]">
                          {doc.title}
                        </p>
                        <p className="text-xs text-slate-400">
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
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Board Contact */}
      <Card className="overflow-hidden rounded-xl border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Phone className="h-4 w-4 text-white" />
            </div>
            Board Contact Info
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            <p className="text-base font-semibold text-[#0f172a]">
              {hoaProfile.name || "Madison Park HOA"}
            </p>
            {hoaProfile.address && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-slate-600">{hoaProfile.address}</span>
              </div>
            )}
            {hoaProfile.email && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <a
                  href={`mailto:${hoaProfile.email}`}
                  className="text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
                >
                  {hoaProfile.email}
                </a>
              </div>
            )}
            {hoaProfile.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <a
                  href={`tel:${hoaProfile.phone}`}
                  className="text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
                >
                  {hoaProfile.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <span className="text-slate-600">Office Hours: Mon–Fri, 9:00 AM – 5:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
