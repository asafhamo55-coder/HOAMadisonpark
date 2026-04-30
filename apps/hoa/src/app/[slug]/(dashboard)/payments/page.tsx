import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { PaymentsView } from "./payments-view"

export type Payment = {
  id: string
  property_id: string
  resident_id: string | null
  amount: number
  due_date: string | null
  paid_date: string | null
  payment_method: string | null
  status: "pending" | "paid" | "overdue" | "waived"
  period: string | null
  notes: string | null
  created_at: string
  properties: { address: string } | null
  residents: { full_name: string } | null
}

export type PaymentStats = {
  totalCollected: number
  totalOutstanding: number
  overdueCount: number
  overdueAmount: number
  paidThisMonth: number
}

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `Q${q} ${now.getFullYear()}`
}

export default async function PaymentsPage() {
  const supabase = createClient()
  const user = await getCurrentUser()
  const isBoardOrAdmin = user?.role === "admin" || user?.role === "board"

  if (!isBoardOrAdmin) {
    return (
      <div>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    )
  }

  const currentQuarter = getCurrentQuarter()

  // Fetch all payments with property + resident info
  const { data } = await supabase
    .from("payments")
    .select("*, properties(address), residents(full_name)")
    .order("created_at", { ascending: false })

  const payments = (data || []) as Payment[]

  // Fetch properties for the record payment modal
  const { data: propertiesData } = await supabase
    .from("properties")
    .select("id, address")
    .order("address")

  const properties = (propertiesData || []) as { id: string; address: string }[]

  // Compute stats for current quarter
  const quarterPayments = payments.filter((p) => p.period === currentQuarter)

  const stats: PaymentStats = {
    totalCollected: quarterPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    totalOutstanding: quarterPayments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    overdueCount: quarterPayments.filter((p) => p.status === "overdue").length,
    overdueAmount: quarterPayments
      .filter((p) => p.status === "overdue")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    paidThisMonth: payments.filter((p) => {
      if (p.status !== "paid" || !p.paid_date) return false
      const now = new Date()
      const pd = new Date(p.paid_date)
      return pd.getMonth() === now.getMonth() && pd.getFullYear() === now.getFullYear()
    }).length,
  }

  // Get unique periods and streets for filters
  const periods = Array.from(new Set(payments.map((p) => p.period).filter(Boolean))) as string[]
  const streets = Array.from(
    new Set(
      payments
        .map((p) => {
          const addr = p.properties?.address || ""
          const parts = addr.split(" ")
          return parts.length > 1 ? parts.slice(1).join(" ") : addr
        })
        .filter(Boolean)
    )
  ).sort()

  return (
    <PaymentsView
      payments={payments}
      stats={stats}
      currentQuarter={currentQuarter}
      periods={periods}
      streets={streets}
      properties={properties}
    />
  )
}
