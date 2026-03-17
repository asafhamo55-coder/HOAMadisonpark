"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  Eye,
  AlertTriangle,
  Mail,
  Users,
  CreditCard,
  Download,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import type { PropertyWithSummary } from "./page-data"

type FilterKey =
  | "all"
  | "occupied"
  | "vacant"
  | "with_violations"
  | "payment_overdue"

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "occupied", label: "Occupied" },
  { key: "vacant", label: "Vacant" },
  { key: "with_violations", label: "With Violations" },
  { key: "payment_overdue", label: "Payment Overdue" },
]

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

export function PropertiesGrid({
  properties,
  userRole,
}: {
  properties: PropertyWithSummary[]
  userRole: string | null
}) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")

  const canManage = userRole === "admin" || userRole === "board"

  const filtered = useMemo(() => {
    let result = properties

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          (p.lot_number && p.lot_number.toLowerCase().includes(q)) ||
          p.currentResidents.some((r) =>
            r.full_name.toLowerCase().includes(q)
          )
      )
    }

    // Status / condition filter
    switch (activeFilter) {
      case "occupied":
        result = result.filter((p) => p.status === "occupied")
        break
      case "vacant":
        result = result.filter((p) => p.status === "vacant")
        break
      case "with_violations":
        result = result.filter((p) => p.openViolations > 0)
        break
      case "payment_overdue":
        result = result.filter((p) => p.overduePayments > 0)
        break
    }

    return result
  }, [properties, search, activeFilter])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search address, resident, lot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = filtered.map((p) => ({
                Address: p.address,
                "Lot #": p.lot_number || "",
                Status: p.status,
                Residents: p.currentResidents.map((r) => r.full_name).join("; "),
                "Open Violations": String(p.openViolations),
                "Overdue Payments": String(p.overduePayments),
              }))
              if (rows.length === 0) return
              const headers = Object.keys(rows[0])
              const csv = [
                headers.join(","),
                ...rows.map((r) =>
                  headers.map((h) => {
                    const v = r[h as keyof typeof r]
                    return v.includes(",") ? `"${v}"` : v
                  }).join(",")
                ),
              ].join("\n")
              const blob = new Blob([csv], { type: "text/csv" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `property-directory-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          {canManage && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeFilter === f.key
                ? "border-sidebar-accent bg-sidebar-accent/10 text-sidebar-accent"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {f.label}
            {f.key === "all" && (
              <span className="ml-1.5 text-muted-foreground">
                ({properties.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results count */}
      {filtered.length !== properties.length && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {properties.length} properties
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">No properties found.</p>
          {search && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setSearch("")
                setActiveFilter("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyCard({
  property,
  canManage,
}: {
  property: PropertyWithSummary
  canManage: boolean
}) {
  const status = statusConfig[property.status] || statusConfig.occupied

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold leading-tight">
              {property.address}
            </h3>
            {property.unit && (
              <p className="text-sm text-muted-foreground">
                Unit {property.unit}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {property.lot_number && (
              <Badge variant="secondary" className="text-[10px]">
                Lot {property.lot_number}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn("text-[10px]", status.className)}
            >
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* Residents */}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 text-sm">
            {property.currentResidents.length > 0 ? (
              property.currentResidents.map((r) => (
                <p key={r.id} className="truncate">
                  <span className="font-medium">{r.full_name}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({r.type})
                  </span>
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">No current residents</p>
            )}
          </div>
        </div>

        {/* Counts */}
        <div className="flex gap-4 text-sm">
          {property.openViolations > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium">
                {property.openViolations} violation
                {property.openViolations !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {property.overduePayments > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="font-medium">
                {property.overduePayments} overdue
              </span>
            </div>
          )}
          {property.openViolations === 0 &&
            property.overduePayments === 0 && (
              <p className="text-muted-foreground">No issues</p>
            )}
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t pt-3">
        <Link href={`/dashboard/properties/${property.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>
        </Link>
        {canManage && (
          <>
            <Link
              href={`/dashboard/violations?property=${property.id}`}
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                Violation
              </Button>
            </Link>
            <Link
              href={`/dashboard/email?property=${property.id}`}
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email
              </Button>
            </Link>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
