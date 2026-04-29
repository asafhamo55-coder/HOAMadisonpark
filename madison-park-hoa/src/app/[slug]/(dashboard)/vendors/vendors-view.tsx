"use client"

import { useState, useMemo, useTransition } from "react"
import { Star, Phone, Plus, Search, Eye, Briefcase, X } from "lucide-react"
import type { Vendor } from "./page-data"
import { createVendor, updateVendorRating, updateVendorNotes } from "./actions"
import { useTenantSlug } from "@/hooks/use-tenant-slug"
import { tenantPath } from "@/lib/tenant-path"

const CATEGORIES = [
  "All",
  "Landscaping",
  "Plumbing",
  "Electrical",
  "Painting",
  "Security",
  "Pest Control",
  "Pool",
  "General",
]

function insuranceStatus(expiry: string | null): "ok" | "warning" | "expired" {
  if (!expiry) return "ok"
  const exp = new Date(expiry)
  const now = new Date()
  if (exp < now) return "expired"
  const diff = exp.getTime() - now.getTime()
  if (diff < 30 * 24 * 60 * 60 * 1000) return "warning"
  return "ok"
}

function StarRating({
  rating,
  editable = false,
  onChange,
}: {
  rating: number | null
  editable?: boolean
  onChange?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!editable}
          className={editable ? "cursor-pointer" : "cursor-default"}
          onMouseEnter={() => editable && setHover(i)}
          onMouseLeave={() => editable && setHover(0)}
          onClick={() => editable && onChange?.(i)}
        >
          <Star
            className={`h-4 w-4 ${
              i <= (hover || rating || 0)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function categoryColor(cat: string | null) {
  const colors: Record<string, string> = {
    Landscaping: "bg-green-100 text-green-800",
    Plumbing: "bg-blue-100 text-blue-800",
    Electrical: "bg-yellow-100 text-yellow-800",
    Painting: "bg-purple-100 text-purple-800",
    Security: "bg-red-100 text-red-800",
    "Pest Control": "bg-orange-100 text-orange-800",
    Pool: "bg-cyan-100 text-cyan-800",
    General: "bg-gray-100 text-gray-800",
  }
  return colors[cat || ""] || "bg-gray-100 text-gray-800"
}

/* ---------- Add Vendor Modal ---------- */
function AddVendorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await createVendor(fd)
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
          <h2 className="text-lg font-semibold">Add Vendor</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Company Name *</label>
            <input
              name="company_name"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Contact Name</label>
              <input
                name="contact_name"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                name="phone"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              name="category"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              name="address"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">License Number</label>
              <input
                name="license_number"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Insurance Expiry</label>
              <input
                name="insurance_expiry"
                type="date"
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
            {pending ? "Adding..." : "Add Vendor"}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ---------- Vendor Detail Modal ---------- */
function VendorDetailModal({
  vendor,
  jobs,
  onClose,
  canManage,
  jobsHref,
}: {
  vendor: Vendor
  jobs: VendorJob[]
  onClose: () => void
  canManage: boolean
  jobsHref: string
}) {
  const [notes, setNotes] = useState(vendor.notes || "")
  const [saving, startSaving] = useTransition()

  const insStatus = insuranceStatus(vendor.insurance_expiry)

  function saveNotes() {
    startSaving(async () => {
      await updateVendorNotes(vendor.id, notes)
    })
  }

  function handleRating(r: number) {
    startSaving(async () => {
      await updateVendorRating(vendor.id, r)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{vendor.company_name}</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact info */}
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Contact:</span>{" "}
            {vendor.contact_name || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>{" "}
            {vendor.phone ? (
              <a href={`tel:${vendor.phone}`} className="text-blue-600">
                {vendor.phone}
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            {vendor.email ? (
              <a href={`mailto:${vendor.email}`} className="text-blue-600">
                {vendor.email}
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Address:</span>{" "}
            {vendor.address || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">License:</span>{" "}
            {vendor.license_number || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Insurance Expiry:</span>{" "}
            <span
              className={
                insStatus === "expired"
                  ? "font-medium text-red-600"
                  : insStatus === "warning"
                  ? "font-medium text-orange-600"
                  : ""
              }
            >
              {vendor.insurance_expiry || "—"}
              {insStatus === "expired" && " (EXPIRED)"}
              {insStatus === "warning" && " (Expiring soon)"}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rating:</span>
          <StarRating
            rating={vendor.rating}
            editable={canManage}
            onChange={handleRating}
          />
        </div>

        {/* Job history */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">Job History</h3>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs on record.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b">
                      <td className="py-2 pr-4">{j.title}</td>
                      <td className="py-2 pr-4 capitalize">
                        {j.status.replace("_", " ")}
                      </td>
                      <td className="py-2 pr-4">
                        {j.scheduled_date || j.created_at?.slice(0, 10) || "—"}
                      </td>
                      <td className="py-2 text-right">
                        {j.cost ? `$${Number(j.cost).toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canManage}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-gray-50"
          />
          {canManage && (
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Notes"}
            </button>
          )}
        </div>

        {canManage && (
          <a
            href={jobsHref}
            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Briefcase className="h-4 w-4" /> Assign New Job
          </a>
        )}
      </div>
    </div>
  )
}

/* ---------- Types for detail modal ---------- */
type VendorJob = {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  created_at: string | null
  cost: string | null
}

/* ---------- Main View ---------- */
export function VendorsView({
  vendors: initialVendors,
  canManage,
}: {
  vendors: Vendor[]
  canManage: boolean
}) {
  const slug = useTenantSlug()
  const jobsHref = tenantPath(slug, "vendors", "jobs")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [activeOnly, setActiveOnly] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null)
  const [detailJobs, setDetailJobs] = useState<VendorJob[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const filtered = useMemo(() => {
    return initialVendors.filter((v) => {
      if (activeOnly && !v.is_active) return false
      if (category !== "All" && v.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        const match =
          v.company_name.toLowerCase().includes(q) ||
          (v.contact_name && v.contact_name.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  }, [initialVendors, search, category, activeOnly])

  async function openDetail(v: Vendor) {
    setDetailVendor(v)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/vendor-jobs?vendor_id=${v.id}`)
      const data = await res.json()
      setDetailJobs(data.jobs || [])
    } catch {
      setDetailJobs([])
    }
    setLoadingDetail(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Vendor Directory</h1>
        <div className="flex items-center gap-3">
          <a
            href={jobsHref}
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Work Orders
          </a>
          {canManage && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Vendor
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === c
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search + Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or contact..."
            className="w-full rounded-md border py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded"
          />
          Active Only
        </label>
      </div>

      {/* Vendor cards grid */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No vendors found.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => {
            const insStatus = insuranceStatus(v.insurance_expiry)
            return (
              <div
                key={v.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold leading-tight">
                    {v.company_name}
                  </h3>
                  {v.active_jobs_count > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {v.active_jobs_count} active
                    </span>
                  )}
                </div>

                {v.category && (
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor(
                      v.category
                    )}`}
                  >
                    {v.category}
                  </span>
                )}

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {v.contact_name && <p>{v.contact_name}</p>}
                  {v.phone && <p>{v.phone}</p>}
                  {v.email && (
                    <a
                      href={`mailto:${v.email}`}
                      className="block text-blue-600 hover:underline"
                    >
                      {v.email}
                    </a>
                  )}
                </div>

                {v.insurance_expiry && (
                  <p
                    className={`mt-2 text-xs ${
                      insStatus === "expired"
                        ? "font-medium text-red-600"
                        : insStatus === "warning"
                        ? "font-medium text-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    Insurance:{" "}
                    {insStatus === "expired"
                      ? "EXPIRED"
                      : insStatus === "warning"
                      ? `Expires ${v.insurance_expiry}`
                      : `Exp. ${v.insurance_expiry}`}
                  </p>
                )}

                <div className="mt-2">
                  <StarRating rating={v.rating} />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openDetail(v)}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3" /> View Details
                  </button>
                  {canManage && (
                    <a
                      href={jobsHref}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-50"
                    >
                      <Briefcase className="h-3 w-3" /> New Job
                    </a>
                  )}
                  {v.phone && (
                    <a
                      href={`tel:${v.phone}`}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-50"
                    >
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddVendorModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {detailVendor && !loadingDetail && (
        <VendorDetailModal
          vendor={detailVendor}
          jobs={detailJobs}
          onClose={() => setDetailVendor(null)}
          canManage={canManage}
          jobsHref={jobsHref}
        />
      )}
    </div>
  )
}
