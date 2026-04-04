"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MapPin,
  Mail,
  AlertTriangle,
  ExternalLink,
  Hash,
  Home,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PropertyDetail } from "./detail-data"
import { updatePropertyStatus, updatePropertyOccupancyType } from "./actions"

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  occupied: {
    label: "Occupied",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  vacant: {
    label: "Vacant",
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
  rental: {
    label: "Rental",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  foreclosure: {
    label: "Foreclosure",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
}

function computeComplianceScore(data: PropertyDetail): number {
  let score = 100
  const { violations, payments } = data

  const activeViolations = violations.filter(
    (v) => !["resolved", "dismissed"].includes(v.status)
  )
  score -= activeViolations.length * 15

  const highSeverity = activeViolations.filter((v) => v.severity === "high")
  score -= highSeverity.length * 10

  const overduePayments = payments.filter((p) => p.status === "overdue")
  score -= overduePayments.length * 10

  const pendingPayments = payments.filter((p) => p.status === "pending")
  score -= pendingPayments.length * 3

  const resolved = violations.filter((v) => v.status === "resolved")
  score += Math.min(resolved.length * 2, 10)

  return Math.max(0, Math.min(100, score))
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "text-emerald-500", bg: "stroke-emerald-500", label: "Good" }
  if (score >= 60) return { ring: "text-amber-500", bg: "stroke-amber-500", label: "Fair" }
  if (score >= 40) return { ring: "text-orange-500", bg: "stroke-orange-500", label: "At Risk" }
  return { ring: "text-red-500", bg: "stroke-red-500", label: "Critical" }
}

export function SidebarPanel({
  data,
  canManage,
}: {
  data: PropertyDetail
  canManage: boolean
}) {
  const { property, currentResidents } = data
  const [status, setStatus] = useState(property.status)
  const [occupancyType, setOccupancyType] = useState(property.occupancy_type || "owner_occupied")

  const score = computeComplianceScore(data)
  const scoreColor = getScoreColor(score)

  const addressParts = [
    property.address_line1 || property.address,
    property.address_line2 || (property.unit ? `Unit ${property.unit}` : ""),
    `${property.city || "Johns Creek"}, ${property.state || "GA"} ${property.zip || "30022"}`,
  ].filter(Boolean)

  const fullAddress = addressParts.join(", ")
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  const primaryEmail = currentResidents.find((r) => r.email)?.email

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus as typeof status)
    const result = await updatePropertyStatus(property.id, newStatus)
    if (result.error) {
      toast.error(result.error)
      setStatus(property.status)
    } else {
      toast.success("Status updated")
    }
  }

  async function handleOccupancyChange(newType: string) {
    setOccupancyType(newType as typeof occupancyType)
    const result = await updatePropertyOccupancyType(property.id, newType)
    if (result.error) {
      toast.error(result.error)
      setOccupancyType(property.occupancy_type || "owner_occupied")
    } else {
      toast.success("Occupancy type updated")
    }
  }

  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="space-y-6">
      {/* Property details */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{fullAddress}</span>
          </div>
          {property.lot_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              <span>Lot {property.lot_number}</span>
            </div>
          )}
          {property.property_type && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              <span>{property.property_type}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          {canManage ? (
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant="outline"
              className={cn(
                statusConfig[property.status]?.className || ""
              )}
            >
              {statusConfig[property.status]?.label || property.status}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Occupancy
          </label>
          {canManage ? (
            <Select value={occupancyType} onValueChange={handleOccupancyChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
                <SelectItem value="rental">Rental</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className={cn(
              occupancyType === "rental"
                ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
            )}>
              {occupancyType === "rental" ? "Rental" : "Owner Occupied"}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h3>
        {canManage && (
          <>
            <Link
              href={`/dashboard/email?property=${property.id}${primaryEmail ? `&to=${primaryEmail}` : ""}`}
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </Link>
            <Link
              href={`/dashboard/violations?property=${property.id}`}
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Log Violation
              </Button>
            </Link>
          </>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full justify-start">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Map
          </Button>
        </a>
      </div>

      <Separator />

      {/* Compliance Score Gauge */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Compliance Score
        </h3>
        <div className="flex flex-col items-center">
          <div className="relative h-28 w-28">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/50"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={cn("transition-all duration-700", scoreColor.bg)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold", scoreColor.ring)}>
                {score}
              </span>
            </div>
          </div>
          <span
            className={cn("mt-1 text-sm font-medium", scoreColor.ring)}
          >
            {scoreColor.label}
          </span>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Based on violations and payment history
          </p>
        </div>
      </div>
    </div>
  )
}
