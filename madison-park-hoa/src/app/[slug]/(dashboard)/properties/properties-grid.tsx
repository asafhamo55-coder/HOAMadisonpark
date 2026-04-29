"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  Pencil,
  Users,
  Download,
  Home,
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
import { AddPropertyModal } from "@/components/properties/add-property-modal"
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

const propertyTypeConfig: Record<string, { className: string }> = {
  "Single Family": {
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  Townhouse: {
    className: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  },
  Condo: {
    className: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  },
  Apartment: {
    className: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  },
  Other: {
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
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
  const [addOpen, setAddOpen] = useState(false)
  const [editProperty, setEditProperty] = useState<PropertyWithSummary | null>(null)

  const canManage = userRole === "admin" || userRole === "board"

  const filtered = useMemo(() => {
    let result = properties

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          (p.address_line1 && p.address_line1.toLowerCase().includes(q)) ||
          (p.lot_number && p.lot_number.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          p.currentResidents.some((r) =>
            r.full_name.toLowerCase().includes(q)
          )
      )
    }

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

  function formatAddress(p: PropertyWithSummary) {
    const line1 = p.address_line1 || p.address
    const parts = [line1]
    if (p.address_line2) parts.push(p.address_line2)
    const cityLine = `${p.city || "Johns Creek"}, ${p.state || "GA"} ${p.zip || "30022"}`
    parts.push(cityLine)
    return parts.join(", ")
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search address, resident name..."
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
                Address: formatAddress(p),
                "Property Type": p.property_type || "",
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
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Property
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
              formatAddress={formatAddress}
              onEdit={() => setEditProperty(property)}
            />
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Property Modal */}
      {editProperty && (
        <AddPropertyModal
          open={!!editProperty}
          onOpenChange={(open) => {
            if (!open) setEditProperty(null)
          }}
          editData={{
            id: editProperty.id,
            address_line1: editProperty.address_line1,
            address_line2: editProperty.address_line2,
            city: editProperty.city,
            state: editProperty.state,
            zip: editProperty.zip,
            country: editProperty.country,
            property_type: editProperty.property_type,
            status: editProperty.status,
            lot_number: editProperty.lot_number,
            notes: editProperty.notes,
          }}
        />
      )}
    </div>
  )
}

function PropertyCard({
  property,
  canManage,
  formatAddress,
  onEdit,
}: {
  property: PropertyWithSummary
  canManage: boolean
  formatAddress: (p: PropertyWithSummary) => string
  onEdit: () => void
}) {
  const typeConfig = propertyTypeConfig[property.property_type || "Other"] ||
    propertyTypeConfig.Other

  const residentNames = property.currentResidents
    .map((r) => r.full_name)
    .join(", ")

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h3 className="truncate text-base font-bold leading-tight">
                {formatAddress(property)}
              </h3>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", typeConfig.className)}
          >
            {property.property_type || "Other"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* Residents */}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 text-sm">
            <span className="font-medium">
              {property.currentResidents.length} resident
              {property.currentResidents.length !== 1 ? "s" : ""}
            </span>
            {residentNames && (
              <p className="truncate text-muted-foreground">{residentNames}</p>
            )}
            {property.currentResidents.length === 0 && (
              <p className="text-muted-foreground">No current residents</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t pt-3">
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit Property
          </Button>
        )}
        <Link
          href={`/dashboard/properties/${property.id}`}
          className="flex-1"
        >
          <Button variant="outline" size="sm" className="w-full">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Manage Residents
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
