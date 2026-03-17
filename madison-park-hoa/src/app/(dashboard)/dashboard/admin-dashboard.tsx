"use client"

import Link from "next/link"
import {
  Home,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Truck,
  Pin,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ViolationsCategoryChart,
  ViolationsMonthChart,
} from "./dashboard-charts"
import type { AdminDashboardData } from "./dashboard-data"

const STAT_ICONS = [Home, AlertTriangle, DollarSign, CreditCard, Truck]
const STAT_COLORS = [
  "text-blue-600 bg-blue-50",
  "text-red-600 bg-red-50",
  "text-yellow-600 bg-yellow-50",
  "text-orange-600 bg-orange-50",
  "text-green-600 bg-green-50",
]

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  notice_sent: "bg-yellow-100 text-yellow-800",
  warning_sent: "bg-orange-100 text-orange-800",
  fine_issued: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
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
  })
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-6">
      {/* ── Row 1: Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {data.stats.map((stat, i) => {
          const Icon = STAT_ICONS[i]
          const colorClass = STAT_COLORS[i]
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg p-2.5 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">
                    {stat.href ? (
                      <Link
                        href={stat.href}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {stat.value}
                      </Link>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Violations by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ViolationsCategoryChart data={data.violationsByCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Violations by Month (Last 6)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ViolationsMonthChart data={data.violationsByMonth} />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Three panels ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Violations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Violations</CardTitle>
            <Link
              href="/dashboard/violations"
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentViolations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No violations yet.
              </p>
            ) : (
              data.recentViolations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {v.property_address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCategory(v.category)} &middot;{" "}
                      {formatDate(v.reported_date)}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      STATUS_COLORS[v.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {formatStatus(v.status)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Letters */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Letters Sent</CardTitle>
            <Link
              href="/dashboard/email"
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentLetters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No letters sent yet.
              </p>
            ) : (
              data.recentLetters.map((l) => (
                <div key={l.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium truncate">
                    {l.recipient_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {l.subject}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDate(l.sent_at)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Upcoming Vendor Jobs</CardTitle>
            <Link
              href="/dashboard/vendors/jobs"
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming jobs.
              </p>
            ) : (
              data.upcomingJobs.map((j) => (
                <div key={j.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {j.vendor_name} &middot; {j.property_address}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    {formatDate(j.scheduled_date)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Announcements + Attention ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Announcements */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Announcements</CardTitle>
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
                No announcements.
              </p>
            ) : (
              data.announcements.map((a) => {
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

        {/* Properties needing attention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Properties Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.attentionProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All properties in good standing.
              </p>
            ) : (
              data.attentionProperties.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/properties/${p.id}`}
                  className="block rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{p.address}</p>
                  <div className="mt-1 flex gap-2 text-xs">
                    {(p.status === "vacant" || p.status === "foreclosure") && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-800 font-medium">
                        {formatStatus(p.status)}
                      </span>
                    )}
                    {p.open_violation_count >= 2 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 font-medium">
                        {p.open_violation_count} open violations
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
