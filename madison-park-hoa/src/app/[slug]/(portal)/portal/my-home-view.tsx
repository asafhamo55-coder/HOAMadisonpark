"use client"

import { useState, useTransition } from "react"
import {
  Home,
  AlertTriangle,
  CreditCard,
  Mail,
  Wrench,
  Scale,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  PortalViolation,
  PortalPayment,
  PortalLetter,
  PortalRequest,
} from "./page"
import { submitRequest } from "@/app/actions/portal"

/* ── Helpers ──────────────────────────────────────────────── */

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatCategory(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const STATUS_STEPS = [
  { key: "open", label: "Open", icon: AlertTriangle },
  { key: "notice_sent", label: "Notice Sent", icon: Mail },
  { key: "warning_sent", label: "Warning Sent", icon: AlertTriangle },
  { key: "fine_issued", label: "Fine Issued", icon: CreditCard },
]

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  notice_sent: "bg-yellow-100 text-yellow-800",
  warning_sent: "bg-orange-100 text-orange-800",
  fine_issued: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
}

const REQUEST_STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
}

/* ── Violation Card ──────────────────────────────────────── */

function ViolationCard({ v }: { v: PortalViolation }) {
  const [expanded, setExpanded] = useState(false)

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === v.status)

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[v.status] || "bg-gray-100"
              }`}
            >
              {formatCategory(v.status)}
            </span>
            <span className="text-sm font-medium truncate">
              {formatCategory(v.category)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Reported {formatDate(v.reported_date)}
            {v.due_date && ` · Due ${formatDate(v.due_date)}`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <p className="text-sm text-gray-700">{v.description}</p>

          {v.fine_amount && v.fine_amount > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">
                Fine: ${Number(v.fine_amount).toFixed(2)}
              </p>
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Status Timeline
            </p>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const reached = i <= currentStepIdx
                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        reached
                          ? "bg-blue-600 text-white"
                          : "border bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-8 ${
                          i < currentStepIdx
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-0 mt-1">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={step.key}
                  className="text-[9px] text-muted-foreground"
                  style={{ width: i < STATUS_STEPS.length - 1 ? "60px" : "auto" }}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>

          {/* Letters for this violation */}
          {v.letters && v.letters.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Related Letters
              </p>
              {v.letters.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 rounded border p-2 text-xs"
                >
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{l.subject}</span>
                  <span className="text-muted-foreground">
                    {formatDate(l.sent_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Letter Viewer ───────────────────────────────────────── */

function LetterViewer({
  letter,
  onClose,
}: {
  letter: PortalLetter
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{letter.subject}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDate(letter.sent_at)}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {letter.body_html ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: letter.body_html }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No letter content available.
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Request Form Modal ──────────────────────────────────── */

function RequestModal({
  type,
  onClose,
}: {
  type: "maintenance" | "arc"
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("type", type)

    startTransition(async () => {
      const result = await submitRequest(fd)
      if (result.error) alert(result.error)
      else onClose()
    })
  }

  const isArc = type === "arc"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isArc ? "ARC Request" : "Maintenance Request"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">
              {isArc ? "Project Name" : "Subject"} *
            </label>
            <input
              name="subject"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder={
                isArc
                  ? "e.g., Fence replacement"
                  : "e.g., Streetlight not working"
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description *</label>
            <textarea
              name="description"
              required
              rows={4}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder={
                isArc
                  ? "Describe the proposed modification in detail..."
                  : "Describe the issue in detail..."
              }
            />
          </div>
          {isArc && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Expected Start</label>
                <input
                  name="expected_start"
                  type="date"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Expected Completion
                </label>
                <input
                  name="expected_end"
                  type="date"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Main View ───────────────────────────────────────────── */

export function MyHomeView({
  propertyAddress,
  violations,
  payments,
  letters,
  requests,
}: {
  propertyAddress: string
  violations: PortalViolation[]
  payments: PortalPayment[]
  letters: PortalLetter[]
  requests: PortalRequest[]
}) {
  const [viewLetter, setViewLetter] = useState<PortalLetter | null>(null)
  const [requestType, setRequestType] = useState<
    "maintenance" | "arc" | null
  >(null)

  const overduePayments = payments.filter((p) => p.status === "overdue")
  const nextDue = payments.find(
    (p) => p.status === "pending" || p.status === "overdue"
  )

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Property Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          <Home className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{propertyAddress}</h1>
          <p className="text-sm text-muted-foreground">My Home</p>
        </div>
      </div>

      {/* Balance Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-green-600" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overduePayments.length > 0 && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">
                {overduePayments.length} overdue payment
                {overduePayments.length !== 1 && "s"} — $
                {overduePayments
                  .reduce((s, p) => s + Number(p.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          )}
          {nextDue ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-xs text-muted-foreground">Next Payment</p>
                <p className="text-2xl font-bold">
                  ${Number(nextDue.amount).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Due {formatDate(nextDue.due_date)}
                  {nextDue.period && ` · ${nextDue.period}`}
                </p>
              </div>
              {nextDue.status === "overdue" && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                  Overdue
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-green-600">
              All payments are up to date.
            </p>
          )}
          {payments.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-blue-600 hover:underline">
                Payment History
              </summary>
              <div className="mt-2 space-y-1">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded border px-3 py-2 text-xs"
                  >
                    <span>
                      {formatDate(p.due_date)}
                      {p.period && ` · ${p.period}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ${Number(p.amount).toFixed(2)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          p.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : p.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {formatCategory(p.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Violations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            My Open Violations ({violations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              No open violations. Great job!
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((v) => (
                <ViolationCard key={v.id} v={v} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Letters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-blue-600" />
            My Letters ({letters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {letters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No letters received.
            </p>
          ) : (
            <div className="space-y-2">
              {letters.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCategory(l.type)} · {formatDate(l.sent_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewLetter(l)}
                    className="shrink-0 rounded-md border px-3 py-1 text-xs font-medium hover:bg-gray-50"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Center */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4 text-purple-600" />
            Request Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <button
              onClick={() => setRequestType("maintenance")}
              className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="rounded-lg bg-yellow-50 p-2 text-yellow-600">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Maintenance Request</p>
                <p className="text-xs text-muted-foreground">
                  Report an issue or request repairs
                </p>
              </div>
            </button>
            <button
              onClick={() => setRequestType("arc")}
              className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">ARC Request</p>
                <p className="text-xs text-muted-foreground">
                  Architectural review for modifications
                </p>
              </div>
            </button>
          </div>

          {/* Recent requests */}
          {requests.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                My Recent Requests
              </p>
              <div className="space-y-2">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded border p-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {r.type === "arc" ? (
                        <Scale className="h-3 w-3 text-blue-500 shrink-0" />
                      ) : (
                        <Wrench className="h-3 w-3 text-yellow-500 shrink-0" />
                      )}
                      <span className="font-medium truncate">{r.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">
                        {formatDate(r.created_at)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          REQUEST_STATUS_COLORS[r.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatCategory(r.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {viewLetter && (
        <LetterViewer
          letter={viewLetter}
          onClose={() => setViewLetter(null)}
        />
      )}
      {requestType && (
        <RequestModal
          type={requestType}
          onClose={() => setRequestType(null)}
        />
      )}
    </div>
  )
}
