"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { Payment, Resident } from "../detail-data"
import { recordPayment } from "../actions"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  paid: {
    label: "Paid",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  overdue: {
    label: "Overdue",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  waived: {
    label: "Waived",
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
}

export function PaymentsTab({
  propertyId,
  payments,
  residents,
  canManage,
}: {
  propertyId: string
  payments: Payment[]
  residents: Resident[]
  canManage: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState("pending")

  const runningBalance = useMemo(() => {
    let balance = 0
    // Process oldest-first for running total
    const sorted = [...payments].reverse()
    return sorted.map((p) => {
      if (p.status === "waived") return { ...p, balance }
      if (p.status === "paid") return { ...p, balance }
      balance += p.amount
      return { ...p, balance }
    }).reverse()
  }, [payments])

  const totalOwed = runningBalance.length > 0 ? runningBalance[0].balance : 0

  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("property_id", propertyId)
    formData.set("status", paymentStatus)

    const result = await recordPayment(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Payment recorded")
      setAddOpen(false)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold">
            Payment Ledger ({payments.length})
          </h3>
          {totalOwed > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
              Balance: ${totalOwed.toFixed(2)}
            </Badge>
          )}
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record Payment
          </Button>
        )}
      </div>

      {payments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No payment records.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Period</th>
                <th className="px-3 py-2 text-left font-medium">Amount</th>
                <th className="px-3 py-2 text-left font-medium">Due</th>
                <th className="px-3 py-2 text-left font-medium">Paid</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {runningBalance.map((p) => {
                const cfg = statusConfig[p.status] || statusConfig.pending
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {p.period || "—"}
                    </td>
                    <td className="px-3 py-2">${p.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {p.due_date
                        ? format(new Date(p.due_date), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {p.paid_date
                        ? format(new Date(p.paid_date), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", cfg.color)}
                      >
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {p.balance > 0 ? `$${p.balance.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a new payment record for this property.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  name="period"
                  placeholder="e.g. 2024-Q1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid_date">Paid Date</Label>
                <Input id="paid_date" name="paid_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={setPaymentStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Method</Label>
                <Input
                  id="payment_method"
                  name="payment_method"
                  placeholder="Check, ACH, etc."
                />
              </div>
              {residents.length > 0 && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="resident_id">Resident</Label>
                  <select
                    id="resident_id"
                    name="resident_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select resident...</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
