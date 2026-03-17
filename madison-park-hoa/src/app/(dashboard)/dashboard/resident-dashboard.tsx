"use client"

import Link from "next/link"
import {
  Home,
  AlertTriangle,
  CreditCard,
  Mail,
  Megaphone,
  FileText,
  MessageSquare,
  Users,
  Pin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ResidentDashboardData } from "./dashboard-data"

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  notice_sent: "bg-yellow-100 text-yellow-800",
  warning_sent: "bg-orange-100 text-orange-800",
  fine_issued: "bg-purple-100 text-purple-800",
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-blue-100 text-blue-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
  event: { label: "Event", color: "bg-purple-100 text-purple-800" },
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },
  policy: { label: "Policy", color: "bg-gray-100 text-gray-800" },
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ResidentDashboard({
  data,
}: {
  data: ResidentDashboardData
}) {
  return (
    <div className="space-y-6">
      {/* Property Header */}
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">My Property</p>
            <p className="text-lg font-bold">
              {data.propertyAddress || "No property linked"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Open Violations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              My Open Violations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.openViolations.length === 0 ? (
              <p className="text-sm text-green-600">
                No open violations. Great job!
              </p>
            ) : (
              data.openViolations.map((v) => (
                <div key={v.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">
                      {formatCategory(v.category)}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_COLORS[v.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {formatStatus(v.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {v.description}
                  </p>
                  <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                    <span>Reported: {formatDate(v.reported_date)}</span>
                    {v.due_date && <span>Due: {formatDate(v.due_date)}</span>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-green-600" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.paymentStatus.overdue > 0 && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">
                  {data.paymentStatus.overdue} overdue payment
                  {data.paymentStatus.overdue !== 1 && "s"}
                </p>
              </div>
            )}
            {data.paymentStatus.nextDue ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Next Payment Due
                </p>
                <p className="text-xl font-bold">
                  ${data.paymentStatus.nextDue.amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Due {formatDate(data.paymentStatus.nextDue.due_date)}
                </p>
                {data.paymentStatus.nextDue.status === "overdue" && (
                  <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    Overdue
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-600">
                All payments are up to date.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Letters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-blue-600" />
              Recent Letters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentLetters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No letters received.
              </p>
            ) : (
              data.recentLetters.map((l) => (
                <div key={l.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium truncate">{l.subject}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDate(l.sent_at)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-purple-600" />
              Community Announcements
            </CardTitle>
            <Link
              href="/dashboard/announcements"
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No announcements at this time.
              </p>
            ) : (
              data.announcements.slice(0, 3).map((a) => {
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
                        {formatDate(a.published_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium">{a.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {a.body}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/dashboard/violations"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium">Submit Request</span>
            </Link>
            <Link
              href="/dashboard/announcements"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium">Contact Board</span>
            </Link>
            <Link
              href="/dashboard/documents"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium">HOA Documents</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
