"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  AlertTriangle,
  FileText,
  Plus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Violation } from "../detail-data"

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-red-500/10 text-red-700 border-red-500/20" },
  notice_sent: { label: "Notice Sent", color: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  warning_sent: { label: "Warning Sent", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  fine_issued: { label: "Fine Issued", color: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  dismissed: { label: "Dismissed", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
}

const severityColors: Record<string, string> = {
  low: "text-blue-600",
  medium: "text-amber-600",
  high: "text-red-600",
}

type FilterKey = "all" | "open" | "resolved" | "dismissed"

export function ViolationsTab({
  propertyId,
  violations,
  canManage,
}: {
  propertyId: string
  violations: Violation[]
  canManage: boolean
}) {
  const [filter, setFilter] = useState<FilterKey>("all")

  const filtered = useMemo(() => {
    switch (filter) {
      case "open":
        return violations.filter(
          (v) => !["resolved", "dismissed"].includes(v.status)
        )
      case "resolved":
        return violations.filter((v) => v.status === "resolved")
      case "dismissed":
        return violations.filter((v) => v.status === "dismissed")
      default:
        return violations
    }
  }, [violations, filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "open", "resolved", "dismissed"] as FilterKey[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f
                    ? "border-sidebar-accent bg-sidebar-accent/10 text-sidebar-accent"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          )}
        </div>
        {canManage && (
          <Link href={`/dashboard/violations?property=${propertyId}`}>
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Log Violation
            </Button>
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No violations found.
        </p>
      ) : (
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          {filtered.map((v) => {
            const cfg = statusConfig[v.status] || statusConfig.open
            return (
              <div key={v.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline dot */}
                <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                  <AlertTriangle
                    className={cn("h-3.5 w-3.5", severityColors[v.severity])}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {v.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", cfg.color)}
                    >
                      {cfg.label}
                    </Badge>
                    {v.fine_amount != null && (
                      <span className="text-xs font-medium text-red-600">
                        ${v.fine_amount.toFixed(2)}
                        {v.fine_paid && (
                          <span className="ml-1 text-emerald-600">(Paid)</span>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-sm">{v.description}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {v.reported_date && (
                      <span>
                        Reported{" "}
                        {format(new Date(v.reported_date), "MMM d, yyyy")}
                      </span>
                    )}
                    {v.due_date && (
                      <span>
                        Due {format(new Date(v.due_date), "MMM d, yyyy")}
                      </span>
                    )}
                    {v.resolved_date && (
                      <span>
                        Resolved{" "}
                        {format(new Date(v.resolved_date), "MMM d, yyyy")}
                      </span>
                    )}
                    {v.reported_by_name && (
                      <span>By {v.reported_by_name}</span>
                    )}
                    {v.linked_letter_id && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Letter linked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
