"use client"

import { useState, useMemo, useTransition } from "react"
import { Plus, X, ArrowLeft, LayoutList, Columns3 } from "lucide-react"
import type { WorkOrder, VendorOption, PropertyOption } from "./page-data"
import { createWorkOrder, updateJobStatus } from "./actions"

const STATUSES = [
  "requested",
  "approved",
  "scheduled",
  "in_progress",
  "completed",
] as const

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-gray-100 text-gray-800",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-purple-100 text-purple-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

function statusLabel(s: string) {
  return s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ---------- New Work Order Modal ---------- */
function NewWorkOrderModal({
  vendors,
  properties,
  onClose,
  onSuccess,
}: {
  vendors: VendorOption[]
  properties: PropertyOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createWorkOrder(fd)
      if (!res.error) {
        onSuccess()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Work Order</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Vendor *</label>
            <select
              name="vendor_id"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">
              Property{" "}
              <span className="text-muted-foreground font-normal">
                (leave blank for community work)
              </span>
            </label>
            <select
              name="property_id"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Community / Common Area</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              name="title"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Scheduled Date</label>
              <input
                name="scheduled_date"
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estimated Cost</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Work Order"}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ---------- Kanban Column ---------- */
function KanbanColumn({
  status,
  jobs,
  canManage,
  onStatusChange,
}: {
  status: string
  jobs: WorkOrder[]
  canManage: boolean
  onStatusChange: (id: string, status: string) => void
}) {
  const idx = STATUSES.indexOf(status as (typeof STATUSES)[number])
  const nextStatus = idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null

  return (
    <div className="flex min-w-[220px] flex-col rounded-lg bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{statusLabel(status)}</h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">
          {jobs.length}
        </span>
      </div>
      <div className="space-y-2">
        {jobs.map((j) => (
          <div
            key={j.id}
            className="rounded-md border bg-white p-3 shadow-sm text-sm"
          >
            <p className="font-medium">{j.title}</p>
            <p className="text-xs text-muted-foreground">{j.vendor_name}</p>
            <p className="text-xs text-muted-foreground">
              {j.property_address || "Community"}
            </p>
            {j.cost && (
              <p className="text-xs mt-1">
                ${Number(j.cost).toLocaleString()}
              </p>
            )}
            {canManage && nextStatus && (
              <button
                onClick={() => onStatusChange(j.id, nextStatus)}
                className="mt-2 w-full rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Move to {statusLabel(nextStatus)} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Main View ---------- */
export function JobsView({
  jobs: initialJobs,
  vendors,
  properties,
  canManage,
}: {
  jobs: WorkOrder[]
  vendors: VendorOption[]
  properties: PropertyOption[]
  canManage: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState<"table" | "kanban">("table")
  const [filterVendor, setFilterVendor] = useState("")
  const [filterProperty, setFilterProperty] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return initialJobs.filter((j) => {
      if (filterVendor && j.vendor_id !== filterVendor) return false
      if (filterProperty) {
        if (filterProperty === "__community") {
          if (j.property_id) return false
        } else if (j.property_id !== filterProperty) return false
      }
      if (filterStatus && j.status !== filterStatus) return false
      if (filterDateFrom && j.scheduled_date && j.scheduled_date < filterDateFrom)
        return false
      if (filterDateTo && j.scheduled_date && j.scheduled_date > filterDateTo)
        return false
      return true
    })
  }, [initialJobs, filterVendor, filterProperty, filterStatus, filterDateFrom, filterDateTo])

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateJobStatus(id, status)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/vendors"
            className="rounded-md border p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <h1 className="text-2xl font-bold">Work Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setView("table")}
              className={`p-2 ${
                view === "table" ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              title="Table view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-2 ${
                view === "kanban" ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              title="Kanban view"
            >
              <Columns3 className="h-4 w-4" />
            </button>
          </div>
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> New Work Order
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Vendor</label>
          <select
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            className="mt-1 block w-full rounded-md border px-2 py-1.5 text-sm min-w-[150px]"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.company_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Property</label>
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="mt-1 block w-full rounded-md border px-2 py-1.5 text-sm min-w-[150px]"
          >
            <option value="">All Properties</option>
            <option value="__community">Community</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border px-2 py-1.5 text-sm min-w-[120px]"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="mt-1 block rounded-md border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="mt-1 block rounded-md border px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Table View */}
      {view === "table" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-muted-foreground">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3 text-right">Cost</th>
                {canManage && <th className="px-4 py-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No work orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((j) => {
                  const idx = STATUSES.indexOf(
                    j.status as (typeof STATUSES)[number]
                  )
                  const nextStatus =
                    idx >= 0 && idx < STATUSES.length - 1
                      ? STATUSES[idx + 1]
                      : null
                  return (
                    <tr key={j.id} className="border-b">
                      <td className="px-4 py-3">{j.vendor_name}</td>
                      <td className="px-4 py-3">
                        {j.property_address || "Community"}
                      </td>
                      <td className="px-4 py-3 font-medium">{j.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[j.status] || ""
                          }`}
                        >
                          {statusLabel(j.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {j.scheduled_date || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {j.cost
                          ? `$${Number(j.cost).toLocaleString()}`
                          : "—"}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {nextStatus && (
                            <button
                              onClick={() =>
                                handleStatusChange(j.id, nextStatus)
                              }
                              className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              → {statusLabel(nextStatus)}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              jobs={filtered.filter((j) => j.status === s)}
              canManage={canManage}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* New Work Order Modal */}
      {showModal && (
        <NewWorkOrderModal
          vendors={vendors}
          properties={properties}
          onClose={() => setShowModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
