"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { format, isPast, parseISO } from "date-fns"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Eye,
  Mail,
  CheckCircle2,
  DollarSign,
  Loader2,
  X,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  ViolationRow,
  ViolationStats,
  PropertyOption,
  ResidentOption,
} from "./page-data"
import {
  resolveViolationAction,
  addFineAction,
  getViolationPhotoUrls,
  updateViolationStatusAction,
} from "@/app/actions/violations"
import { LogViolationModal } from "@/components/violations/log-violation-modal"

// ── Config maps ──────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  Landscaping: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Parking: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  Noise: "bg-red-500/10 text-red-700 border-red-500/20",
  Trash: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Exterior: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Pets: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  default: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-700 border-red-500/20",
  notice_sent: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  warning_sent: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  fine_issued: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  dismissed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const statusLabels: Record<string, string> = {
  open: "Open",
  notice_sent: "Notice Sent",
  warning_sent: "Warning Sent",
  fine_issued: "Fine Issued",
  resolved: "Resolved",
  dismissed: "Dismissed",
}

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  high: "bg-red-500/10 text-red-700 border-red-500/20",
}

// ── Column helper ────────────────────────────────────────────

const columnHelper = createColumnHelper<ViolationRow>()

// ── Main component ───────────────────────────────────────────

export function ViolationsView({
  violations,
  stats,
  properties,
  residents,
  canManage,
}: {
  violations: ViolationRow[]
  stats: ViolationStats
  properties: PropertyOption[]
  residents: ResidentOption[]
  canManage: boolean
}) {
  // Filter state
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [streetFilter, setStreetFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [fineViolation, setFineViolation] = useState<ViolationRow | null>(null)
  const [viewViolation, setViewViolation] = useState<ViolationRow | null>(null)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Unique streets for filter
  const streets = useMemo(() => {
    const set = new Set<string>()
    violations.forEach((v) => {
      if (v.property_street) set.add(v.property_street)
    })
    return Array.from(set).sort()
  }, [violations])

  // Pre-filter data
  const filteredData = useMemo(() => {
    let data = violations

    if (statusFilter !== "all") {
      data = data.filter((v) => v.status === statusFilter)
    }
    if (categoryFilter !== "all") {
      data = data.filter((v) => v.category === categoryFilter)
    }
    if (severityFilter !== "all") {
      data = data.filter((v) => v.severity === severityFilter)
    }
    if (streetFilter !== "all") {
      data = data.filter((v) => v.property_street === streetFilter)
    }
    if (dateFrom) {
      data = data.filter((v) => v.reported_date && v.reported_date >= dateFrom)
    }
    if (dateTo) {
      data = data.filter((v) => v.reported_date && v.reported_date <= dateTo)
    }

    return data
  }, [
    violations,
    statusFilter,
    categoryFilter,
    severityFilter,
    streetFilter,
    dateFrom,
    dateTo,
  ])

  // Unique categories from data
  const categories = useMemo(() => {
    const set = new Set<string>()
    violations.forEach((v) => set.add(v.category))
    return Array.from(set).sort()
  }, [violations])

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor("property_address", {
        header: "Property",
        cell: (info) => (
          <Link
            href={`/dashboard/properties/${info.row.original.property_id}`}
            className="font-medium text-sidebar-accent hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("resident_name", {
        header: "Resident",
        cell: (info) => (
          <span className="text-sm">
            {info.getValue() || (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => {
          const cat = info.getValue()
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                categoryColors[cat] || categoryColors.default
              )}
            >
              {cat}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => {
          const desc = info.getValue()
          const truncated = desc.length > 50 ? desc.slice(0, 50) + "…" : desc
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default text-sm">{truncated}</span>
                </TooltipTrigger>
                {desc.length > 50 && (
                  <TooltipContent className="max-w-xs">
                    <p>{desc}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        },
      }),
      columnHelper.accessor("severity", {
        header: "Severity",
        cell: (info) => {
          const sev = info.getValue()
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] capitalize",
                severityColors[sev] || ""
              )}
            >
              {sev}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const st = info.getValue()
          return (
            <Badge
              variant="outline"
              className={cn("text-[10px]", statusColors[st] || "")}
            >
              {statusLabels[st] || st}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("reported_date", {
        header: "Reported",
        cell: (info) => {
          const d = info.getValue()
          return (
            <span className="text-sm text-muted-foreground">
              {d ? format(parseISO(d), "MMM d, yyyy") : "—"}
            </span>
          )
        },
      }),
      columnHelper.accessor("due_date", {
        header: "Due Date",
        cell: (info) => {
          const d = info.getValue()
          if (!d) return <span className="text-sm text-muted-foreground">—</span>
          const past = isPast(parseISO(d))
          const isOpen = !["resolved", "dismissed"].includes(
            info.row.original.status
          )
          return (
            <span
              className={cn(
                "text-sm",
                past && isOpen ? "font-semibold text-red-600" : "text-muted-foreground"
              )}
            >
              {format(parseISO(d), "MMM d, yyyy")}
            </span>
          )
        },
      }),
      columnHelper.accessor("fine_amount", {
        header: "Fine",
        cell: (info) => {
          const amt = info.getValue()
          if (amt == null) return <span className="text-sm text-muted-foreground">—</span>
          return (
            <span className="text-sm font-medium">
              ${amt.toFixed(2)}
              {info.row.original.fine_paid && (
                <span className="ml-1 text-xs text-emerald-600">(Paid)</span>
              )}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const v = info.row.original
          const isActive = !["resolved", "dismissed"].includes(v.status)
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewViolation(v)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {canManage && isActive && (
                <>
                  <Link
                    href={`/dashboard/email?property=${v.property_id}&violation=${v.id}`}
                  >
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <ResolveButton violationId={v.id} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFineViolation(v)}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          )
        },
      }),
    ],
    [canManage]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  })

  function exportCsv() {
    const headers = [
      "Property",
      "Resident",
      "Category",
      "Description",
      "Severity",
      "Status",
      "Reported",
      "Due Date",
      "Fine",
      "Paid",
    ]
    const rows = filteredData.map((v) => [
      v.property_address,
      v.resident_name || "",
      v.category,
      `"${v.description.replace(/"/g, '""')}"`,
      v.severity,
      v.status,
      v.reported_date || "",
      v.due_date || "",
      v.fine_amount != null ? v.fine_amount.toFixed(2) : "",
      v.fine_paid ? "Yes" : "No",
    ])
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `violations-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    severityFilter !== "all" ||
    streetFilter !== "all" ||
    dateFrom ||
    dateTo

  function clearFilters() {
    setStatusFilter("all")
    setCategoryFilter("all")
    setSeverityFilter("all")
    setStreetFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Open"
          value={stats.totalOpen.toString()}
          className="border-red-500/20"
        />
        <StatCard
          title="Notices Sent"
          value={stats.noticesSent.toString()}
          className="border-orange-500/20"
        />
        <StatCard
          title="Warnings Sent"
          value={stats.warningsSent.toString()}
          className="border-amber-500/20"
        />
        <StatCard
          title="Unpaid Fines"
          value={`$${stats.unpaidFinesTotal.toFixed(2)}`}
          className="border-rose-500/20"
        />
        <StatCard
          title="Resolved This Month"
          value={stats.resolvedThisMonth.toString()}
          className="border-emerald-500/20"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search violations..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Log Violation
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={Object.entries(statusLabels).map(([k, v]) => ({
            value: k,
            label: v,
          }))}
        />
        <FilterSelect
          label="Category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categories.map((c) => ({ value: c, label: c }))}
        />
        <FilterSelect
          label="Severity"
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />
        {streets.length > 0 && (
          <FilterSelect
            label="Street"
            value={streetFilter}
            onChange={setStreetFilter}
            options={streets.map((s) => ({ value: s, label: s }))}
          />
        )}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-36"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-36"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground"
                >
                  No violations found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}
          –
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Create Violation Modal */}
      <LogViolationModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        properties={properties}
        residents={residents}
      />

      {/* Add Fine Modal */}
      <AddFineDialog
        violation={fineViolation}
        onClose={() => setFineViolation(null)}
      />

      {/* Violation Detail Modal */}
      <ViolationDetailDialog
        violation={viewViolation}
        onClose={() => setViewViolation(null)}
      />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({
  title,
  value,
  className,
}: {
  title: string
  value: string
  className?: string
}) {
  return (
    <Card className={cn("border-l-4", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ResolveButton({ violationId }: { violationId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleResolve() {
    setLoading(true)
    const result = await resolveViolationAction(violationId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Violation resolved")
    }
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={handleResolve}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function AddFineDialog({
  violation,
  onClose,
}: {
  violation: ViolationRow | null
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!violation) return
    setLoading(true)

    const result = await addFineAction(
      violation.id,
      parseFloat(amount)
    )
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Fine added")
      onClose()
      setAmount("")
    }
    setLoading(false)
  }

  return (
    <Dialog open={violation !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Fine</DialogTitle>
          <DialogDescription>
            {violation &&
              `${violation.category} violation at ${violation.property_address}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fine_amount">Fine Amount ($) *</Label>
            <Input
              id="fine_amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Fine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Violation Detail Dialog ─────────────────────────────────

function ViolationDetailDialog({
  violation,
  onClose,
}: {
  violation: ViolationRow | null
  onClose: () => void
}) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)

  useEffect(() => {
    if (violation?.photos?.length) {
      setLoadingPhotos(true)
      getViolationPhotoUrls(violation.photos).then((result) => {
        setPhotoUrls(result.urls)
        setLoadingPhotos(false)
      })
    } else {
      setPhotoUrls([])
    }
  }, [violation])

  async function handleStatusChange(newStatus: string) {
    if (!violation) return
    setChangingStatus(true)
    const result = await updateViolationStatusAction(violation.id, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Status changed to ${newStatus.replace(/_/g, " ")}`)
      onClose()
    }
    setChangingStatus(false)
  }

  if (!violation) return null

  const statusCfg = statusColors[violation.status] || statusColors.open

  return (
    <>
      <Dialog open={violation !== null} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {violation.category} Violation
            </DialogTitle>
            <DialogDescription>
              {violation.property_address}
              {violation.resident_name && ` — ${violation.resident_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status & Severity */}
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("text-xs", statusCfg)}>
                  {violation.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", severityColors[violation.severity])}>
                  {violation.severity.charAt(0).toUpperCase() + violation.severity.slice(1)}
                </Badge>
              </div>
              <Select
                value={violation.status}
                onValueChange={handleStatusChange}
                disabled={changingStatus}
              >
                <SelectTrigger className="h-7 w-44 text-xs">
                  {changingStatus ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Change status..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="notice_sent">Notice Sent</SelectItem>
                  <SelectItem value="warning_sent">Warning Sent</SelectItem>
                  <SelectItem value="fine_issued">Fine Issued</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap">{violation.description}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Reported Date</p>
                <p className="text-sm">
                  {violation.reported_date
                    ? format(parseISO(violation.reported_date), "MMM d, yyyy")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Due Date</p>
                <p className="text-sm">
                  {violation.due_date
                    ? format(parseISO(violation.due_date), "MMM d, yyyy")
                    : "—"}
                </p>
              </div>
            </div>

            {/* Fine */}
            {violation.fine_amount != null && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Fine</p>
                <p className="text-sm font-semibold">
                  ${violation.fine_amount.toFixed(2)}
                  {violation.fine_paid && (
                    <span className="ml-2 text-emerald-600 font-normal">(Paid)</span>
                  )}
                </p>
              </div>
            )}

            {/* Notes */}
            {violation.notes && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Internal Notes</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{violation.notes}</p>
              </div>
            )}

            {/* Photos */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />
                Photos ({violation.photos?.length || 0})
              </p>
              {loadingPhotos ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading photos...</span>
                </div>
              ) : photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photoUrls.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setExpandedPhoto(url)}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/30 hover:border-sidebar-accent transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Violation photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No photos attached.</p>
              )}
            </div>

            {/* Property Link */}
            <div className="pt-2 border-t">
              <Link
                href={`/dashboard/properties/${violation.property_id}`}
                className="text-xs text-sidebar-accent hover:underline"
              >
                View Property Details
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Photo Modal */}
      <Dialog open={expandedPhoto !== null} onOpenChange={(o) => !o && setExpandedPhoto(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo</DialogTitle>
            <DialogDescription>Violation photo</DialogDescription>
          </DialogHeader>
          {expandedPhoto && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={expandedPhoto}
              alt="Violation photo enlarged"
              className="h-full w-full object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
