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
  ArrowRight,
  Mail,
  Briefcase,
  Megaphone,
  ShieldAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ViolationsCategoryChart,
  ViolationsMonthChart,
  OccupancyChart,
} from "./dashboard-charts"
import type { AdminDashboardData } from "./dashboard-data"

const STAT_ICONS = [Home, AlertTriangle, DollarSign, CreditCard, Truck]
const STAT_GRADIENT_BG = [
  "bg-gradient-to-br from-blue-500/10 to-indigo-500/10",
  "bg-gradient-to-br from-red-500/10 to-rose-500/10",
  "bg-gradient-to-br from-amber-500/10 to-yellow-500/10",
  "bg-gradient-to-br from-orange-500/10 to-amber-500/10",
  "bg-gradient-to-br from-emerald-500/10 to-green-500/10",
]
const STAT_ICON_COLORS = [
  "text-blue-600",
  "text-red-600",
  "text-amber-600",
  "text-orange-600",
  "text-emerald-600",
]

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
  notice_sent: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10",
  warning_sent: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/10",
  fine_issued: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/10",
  resolved: "bg-green-50 text-green-700 ring-1 ring-green-600/10",
  dismissed: "bg-gray-50 text-gray-600 ring-1 ring-gray-500/10",
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10" },
  urgent: { label: "Urgent", color: "bg-red-50 text-red-700 ring-1 ring-red-600/10" },
  event: { label: "Event", color: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/10" },
  maintenance: { label: "Maintenance", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10" },
  policy: { label: "Policy", color: "bg-slate-100 text-slate-700 ring-1 ring-slate-500/10" },
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function SectionHeader({
  icon: Icon,
  title,
  href,
  linkText = "View All",
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  href?: string
  linkText?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
        >
          {linkText}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-8">
      {/* ── Row 1: Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {data.stats.map((stat, i) => {
          const Icon = STAT_ICONS[i]
          const gradientBg = STAT_GRADIENT_BG[i]
          const iconColor = STAT_ICON_COLORS[i]
          return (
            <Card
              key={stat.label}
              className="group relative overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300/60"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                    gradientBg
                  )}
                >
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {stat.href ? (
                      <Link
                        href={stat.href}
                        className="transition-colors hover:text-indigo-600"
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
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Analytics
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
                Violations by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <ViolationsCategoryChart data={data.violationsByCategory} />
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
                Violations by Month (Last 6)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <ViolationsMonthChart data={data.violationsByMonth} />
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
                Owner vs. Rental
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <OccupancyChart data={data.occupancyBreakdown} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 3: Three panels ── */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Recent Activity
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Recent Violations */}
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
              <SectionHeader
                icon={AlertTriangle}
                title="Recent Violations"
                href="/dashboard/violations"
              />
            </CardHeader>
            <CardContent className="space-y-2.5 px-6 pb-5">
              {data.recentViolations.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No violations yet.
                </p>
              ) : (
                data.recentViolations.map((v) => (
                  <div
                    key={v.id}
                    className="group/item flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-150 hover:border-indigo-100 hover:bg-indigo-50/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {v.property_address}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatCategory(v.category)} &middot;{" "}
                        {formatDate(v.reported_date)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                        STATUS_COLORS[v.status] || "bg-gray-50 text-gray-600"
                      )}
                    >
                      {formatStatus(v.status)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Letters */}
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
              <SectionHeader
                icon={Mail}
                title="Recent Letters Sent"
                href="/dashboard/email"
              />
            </CardHeader>
            <CardContent className="space-y-2.5 px-6 pb-5">
              {data.recentLetters.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No letters sent yet.
                </p>
              ) : (
                data.recentLetters.map((l) => (
                  <div
                    key={l.id}
                    className="group/item rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-150 hover:border-indigo-100 hover:bg-indigo-50/30"
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {l.recipient_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {l.subject}
                    </p>
                    <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                      {formatDate(l.sent_at)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Jobs */}
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
            <CardHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
              <SectionHeader
                icon={Briefcase}
                title="Upcoming Vendor Jobs"
                href="/dashboard/vendors/jobs"
              />
            </CardHeader>
            <CardContent className="space-y-2.5 px-6 pb-5">
              {data.upcomingJobs.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No upcoming jobs.
                </p>
              ) : (
                data.upcomingJobs.map((j) => (
                  <div
                    key={j.id}
                    className="group/item rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-150 hover:border-indigo-100 hover:bg-indigo-50/30"
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {j.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {j.vendor_name} &middot; {j.property_address}
                    </p>
                    <p className="mt-1.5 flex items-center text-[10px] font-medium text-slate-400">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {formatDate(j.scheduled_date)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 4: Announcements + Attention ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Announcements */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
          <CardHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
            <SectionHeader
              icon={Megaphone}
              title="Announcements"
              href="/dashboard/announcements"
            />
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-5">
            {data.announcements.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No announcements.
              </p>
            ) : (
              data.announcements.map((a) => {
                const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general
                const isUrgent = a.type === "urgent"
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-150",
                      isUrgent
                        ? "border-red-200 bg-gradient-to-br from-red-50/80 to-rose-50/50 hover:border-red-300"
                        : "border-slate-100 bg-slate-50/50 hover:border-indigo-100 hover:bg-indigo-50/30"
                    )}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      {isUrgent && (
                        <Pin className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          tc.color
                        )}
                      >
                        {tc.label}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDate(a.published_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
                      {a.body}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Properties needing attention */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
          <CardHeader className="px-6 pt-5 pb-3">
            <SectionHeader icon={ShieldAlert} title="Properties Needing Attention" />
          </CardHeader>
          <CardContent className="space-y-2.5 px-6 pb-5">
            {data.attentionProperties.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <Home className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  All properties in good standing
                </p>
              </div>
            ) : (
              data.attentionProperties.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/properties/${p.id}`}
                  className="group/item flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-150 hover:border-indigo-100 hover:bg-indigo-50/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover/item:text-indigo-700">
                      {p.address}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(p.status === "vacant" || p.status === "foreclosure") && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {formatStatus(p.status)}
                        </span>
                      )}
                      {p.open_violation_count >= 2 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-600/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          {p.open_violation_count} open violations
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover/item:translate-x-0.5 group-hover/item:text-indigo-500" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
