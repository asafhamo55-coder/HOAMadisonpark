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
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ResidentDashboardData } from "./dashboard-data"

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
  notice_sent: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10",
  warning_sent: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/10",
  fine_issued: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/10",
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
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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

export function ResidentDashboard({
  data,
}: {
  data: ResidentDashboardData
}) {
  return (
    <div className="space-y-8">
      {/* Property Header */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-50" />
        <CardContent className="relative flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Home className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
              My Property
            </p>
            <p className="text-xl font-bold text-white">
              {data.propertyAddress || "No property linked"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Open Violations */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
          <CardHeader className="px-6 pt-5 pb-3">
            <SectionHeader icon={AlertTriangle} title="My Open Violations" />
          </CardHeader>
          <CardContent className="space-y-2.5 px-6 pb-5">
            {data.openViolations.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <Home className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  No open violations. Great job!
                </p>
              </div>
            ) : (
              data.openViolations.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-150 hover:border-indigo-100 hover:bg-indigo-50/30"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCategory(v.category)}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                        STATUS_COLORS[v.status] || "bg-gray-50 text-gray-600"
                      )}
                    >
                      {formatStatus(v.status)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {v.description}
                  </p>
                  <div className="mt-2.5 flex gap-4 text-[10px] font-medium text-slate-400">
                    <span>Reported: {formatDate(v.reported_date)}</span>
                    {v.due_date && (
                      <span className="text-amber-600">
                        Due: {formatDate(v.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
          <CardHeader className="px-6 pt-5 pb-3">
            <SectionHeader icon={CreditCard} title="Payment Status" />
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {data.paymentStatus.overdue > 0 && (
              <div className="mb-3 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm font-semibold text-red-800">
                    {data.paymentStatus.overdue} overdue payment
                    {data.paymentStatus.overdue !== 1 && "s"}
                  </p>
                </div>
              </div>
            )}
            {data.paymentStatus.nextDue ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Next Payment Due
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  ${data.paymentStatus.nextDue.amount.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Due {formatDate(data.paymentStatus.nextDue.due_date)}
                </p>
                {data.paymentStatus.nextDue.status === "overdue" && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-600/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Overdue
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  All payments are up to date.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Letters */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
          <CardHeader className="px-6 pt-5 pb-3">
            <SectionHeader icon={Mail} title="Recent Letters" />
          </CardHeader>
          <CardContent className="space-y-2.5 px-6 pb-5">
            {data.recentLetters.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No letters received.
              </p>
            ) : (
              data.recentLetters.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-150 hover:border-indigo-100 hover:bg-indigo-50/30"
                >
                  <p className="text-sm font-medium text-slate-800 truncate">
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

        {/* Announcements */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
          <CardHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
            <SectionHeader
              icon={Megaphone}
              title="Community Announcements"
              href="/dashboard/announcements"
            />
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-5">
            {data.announcements.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No announcements at this time.
              </p>
            ) : (
              data.announcements.slice(0, 3).map((a) => {
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
      </div>

      {/* Quick Links */}
      <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/60">
        <CardHeader className="px-6 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/dashboard/violations"
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 transition-transform duration-200 group-hover:scale-110">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700">
                Submit Request
              </span>
            </Link>
            <Link
              href="/dashboard/announcements"
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 transition-transform duration-200 group-hover:scale-110">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
                Contact Board
              </span>
            </Link>
            <Link
              href="/dashboard/documents"
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 transition-transform duration-200 group-hover:scale-110">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-violet-700">
                HOA Documents
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
