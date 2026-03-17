"use client"

import { useState, useMemo } from "react"
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Plus,
  Ban,
  Zap,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Payment, PaymentStats } from "./page"
import {
  generateDuesForPeriod,
  recordPayment,
  waivePayment,
  sendPaymentReminders,
} from "@/app/actions/payments"

/* ── Helpers ──────────────────────────────────────────────── */

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
  waived: { label: "Waived", className: "bg-gray-100 text-gray-600" },
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n)
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/* ── Main Component ──────────────────────────────────────── */

export function PaymentsView({
  payments,
  stats,
  currentQuarter,
  periods,
  streets,
  properties,
}: {
  payments: Payment[]
  stats: PaymentStats
  currentQuarter: string
  periods: string[]
  streets: string[]
  properties: { id: string; address: string }[]
}) {
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [streetFilter, setStreetFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showWaiveModal, setShowWaiveModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Loading states
  const [reminderLoading, setReminderLoading] = useState(false)
  const [reminderResult, setReminderResult] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (periodFilter !== "all" && p.period !== periodFilter) return false
      if (streetFilter !== "all") {
        const addr = p.properties?.address || ""
        if (!addr.toLowerCase().includes(streetFilter.toLowerCase())) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const addr = (p.properties?.address || "").toLowerCase()
        const name = (p.residents?.full_name || "").toLowerCase()
        if (!addr.includes(q) && !name.includes(q)) return false
      }
      return true
    })
  }, [payments, statusFilter, periodFilter, streetFilter, searchQuery])

  async function handleSendReminders() {
    setReminderLoading(true)
    setReminderResult(null)
    const result = await sendPaymentReminders(periodFilter !== "all" ? periodFilter : currentQuarter)
    if (result.error) {
      setReminderResult(`Sent ${result.sent}/${result.total}. ${result.error}`)
    } else {
      setReminderResult(`Sent ${result.sent} reminder${result.sent !== 1 ? "s" : ""} successfully.`)
    }
    setReminderLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateModal(true)}
          >
            <Zap className="mr-1 h-4 w-4" />
            Generate Dues
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReminders}
            disabled={reminderLoading}
          >
            <Send className="mr-1 h-4 w-4" />
            {reminderLoading ? "Sending…" : "Send Reminders"}
          </Button>
          <Button size="sm" onClick={() => setShowRecordModal(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {reminderResult && (
        <div className="rounded-lg border bg-blue-50 px-4 py-2 text-sm text-blue-800">
          {reminderResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected ({currentQuarter})
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(stats.totalCollected)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-700">
              {formatCurrency(stats.totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {stats.overdueCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overdueAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.paidThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search address or name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="waived">Waived</option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">All Periods</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={streetFilter}
              onChange={(e) => setStreetFilter(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">All Streets</option>
              {streets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Resident</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Paid Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pending
                    return (
                      <tr key={p.id} className="border-b hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">
                          {p.properties?.address || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {p.residents?.full_name || "—"}
                        </td>
                        <td className="px-4 py-3">{p.period || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Number(p.amount))}
                        </td>
                        <td className="px-4 py-3">{formatDate(p.due_date)}</td>
                        <td className="px-4 py-3">{formatDate(p.paid_date)}</td>
                        <td className="px-4 py-3 capitalize">
                          {p.payment_method || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(p.status === "pending" || p.status === "overdue") && (
                            <button
                              onClick={() => {
                                setSelectedPayment(p)
                                setShowWaiveModal(true)
                              }}
                              className="text-xs text-gray-500 hover:text-red-600"
                              title="Waive payment"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        properties={properties}
        periods={periods}
        currentQuarter={currentQuarter}
      />

      {/* Waive Payment Modal */}
      <WaivePaymentModal
        open={showWaiveModal}
        onClose={() => {
          setShowWaiveModal(false)
          setSelectedPayment(null)
        }}
        payment={selectedPayment}
      />

      {/* Generate Dues Modal */}
      <GenerateDuesModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        currentQuarter={currentQuarter}
      />
    </div>
  )
}

/* ── Record Payment Modal ─────────────────────────────────── */

function RecordPaymentModal({
  open,
  onClose,
  properties,
  periods,
  currentQuarter,
}: {
  open: boolean
  onClose: () => void
  properties: { id: string; address: string }[]
  periods: string[]
  currentQuarter: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertySearch, setPropertySearch] = useState("")
  const [selectedProperty, setSelectedProperty] = useState("")
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState(currentQuarter)
  const [method, setMethod] = useState("check")
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState("")

  const filteredProperties = properties.filter((p) =>
    p.address.toLowerCase().includes(propertySearch.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProperty || !amount || !period) {
      setError("Property, amount, and period are required.")
      return
    }
    setLoading(true)
    setError(null)
    const result = await recordPayment({
      property_id: selectedProperty,
      amount: parseFloat(amount),
      period,
      payment_method: method,
      paid_date: paidDate,
      notes: notes || undefined,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      resetForm()
      onClose()
    }
  }

  function resetForm() {
    setSelectedProperty("")
    setPropertySearch("")
    setAmount("")
    setPeriod(currentQuarter)
    setMethod("check")
    setPaidDate(new Date().toISOString().slice(0, 10))
    setNotes("")
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          resetForm()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property search */}
          <div className="space-y-1">
            <Label>Property</Label>
            <Input
              placeholder="Search address…"
              value={propertySearch}
              onChange={(e) => {
                setPropertySearch(e.target.value)
                setSelectedProperty("")
              }}
            />
            {propertySearch && !selectedProperty && (
              <div className="max-h-32 overflow-y-auto rounded-md border bg-white shadow-sm">
                {filteredProperties.slice(0, 8).map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                    onClick={() => {
                      setSelectedProperty(p.id)
                      setPropertySearch(p.address)
                    }}
                  >
                    {p.address}
                  </button>
                ))}
                {filteredProperties.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    No properties found
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Period</Label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="ach">ACH / Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="zelle">Zelle</option>
                <option value="venmo">Venmo</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Paid Date</Label>
              <Input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Check #, receipt number, etc."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onClose()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Waive Payment Modal ──────────────────────────────────── */

function WaivePaymentModal({
  open,
  onClose,
  payment,
}: {
  open: boolean
  onClose: () => void
  payment: Payment | null
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleWaive() {
    if (!payment) return
    if (!reason.trim()) {
      setError("Reason is required.")
      return
    }
    setLoading(true)
    setError(null)
    const result = await waivePayment(payment.id, reason)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setReason("")
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setReason("")
          setError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Waive Payment</DialogTitle>
        </DialogHeader>
        {payment && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium">{payment.properties?.address}</p>
              <p className="text-muted-foreground">
                {payment.period} · {formatCurrency(Number(payment.amount))}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Reason for waiving *</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Board-approved exemption, hardship, etc."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReason("")
                  setError(null)
                  onClose()
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={loading}
                onClick={handleWaive}
              >
                {loading ? "Waiving…" : "Waive Payment"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Generate Dues Modal ──────────────────────────────────── */

function GenerateDuesModal({
  open,
  onClose,
  currentQuarter,
}: {
  open: boolean
  onClose: () => void
  currentQuarter: string
}) {
  const [period, setPeriod] = useState(currentQuarter)
  const [amount, setAmount] = useState("250")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleGenerate() {
    if (!period || !amount) {
      setError("Period and amount are required.")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    const result = await generateDuesForPeriod(period, parseFloat(amount))
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`Generated ${result.count} payment records for ${period}.`)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setError(null)
          setSuccess(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Quarterly Dues</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Period</Label>
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Q2 2025"
            />
            <p className="text-xs text-muted-foreground">
              Format: Q1 2025, Q2 2025, etc.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Amount per property ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                setSuccess(null)
                onClose()
              }}
            >
              {success ? "Close" : "Cancel"}
            </Button>
            {!success && (
              <Button disabled={loading} onClick={handleGenerate}>
                {loading ? "Generating…" : "Generate Dues"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
