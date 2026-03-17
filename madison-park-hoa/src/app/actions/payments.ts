"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email/send"

/* ── Generate Dues ───────────────────────────────────────── */

export async function generateDuesForPeriod(period: string, amount: number) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const supabase = createClient()

  // Get all active properties with current residents
  const { data: properties } = await supabase
    .from("properties")
    .select("id, residents(id, is_current)")
    .in("status", ["occupied", "rental"])

  if (!properties || properties.length === 0) {
    return { error: "No active properties found" }
  }

  // Check if dues already exist for this period
  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("period", period)

  if (count && count > 0) {
    return { error: `Dues for ${period} already exist (${count} records). Delete them first to regenerate.` }
  }

  // Calculate default due date (first of next quarter)
  const dueDate = getQuarterDueDate(period)

  const records = properties.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentResident = (p.residents as any[])?.find(
      (r: { is_current: boolean }) => r.is_current
    )
    return {
      property_id: p.id,
      resident_id: currentResident?.id || null,
      amount,
      due_date: dueDate,
      status: "pending" as const,
      period,
    }
  })

  const { error } = await supabase.from("payments").insert(records)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/payments")
  return { error: null, count: records.length }
}

function getQuarterDueDate(period: string): string {
  // Parse "Q2 2025" format
  const match = period.match(/Q(\d)\s*(\d{4})/)
  if (!match) return new Date().toISOString().slice(0, 10)

  const quarter = parseInt(match[1])
  const year = parseInt(match[2])
  const month = (quarter - 1) * 3 // Q1=Jan, Q2=Apr, Q3=Jul, Q4=Oct
  return `${year}-${String(month + 1).padStart(2, "0")}-01`
}

/* ── Record Payment ──────────────────────────────────────── */

export async function recordPayment(data: {
  property_id: string
  amount: number
  period: string
  payment_method: string
  paid_date: string
  notes?: string
}) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  const supabase = createClient()

  // Find existing pending/overdue payment for this property+period
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("property_id", data.property_id)
    .eq("period", data.period)
    .in("status", ["pending", "overdue"])
    .limit(1)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("payments")
      .update({
        amount: data.amount,
        paid_date: data.paid_date,
        payment_method: data.payment_method,
        status: "paid",
        notes: data.notes || null,
      })
      .eq("id", existing.id)

    if (error) return { error: error.message }
  } else {
    // Get current resident for this property
    const { data: resident } = await supabase
      .from("residents")
      .select("id")
      .eq("property_id", data.property_id)
      .eq("is_current", true)
      .limit(1)
      .single()

    // Create new paid record
    const { error } = await supabase.from("payments").insert({
      property_id: data.property_id,
      resident_id: resident?.id || null,
      amount: data.amount,
      period: data.period,
      paid_date: data.paid_date,
      payment_method: data.payment_method,
      status: "paid",
      notes: data.notes || null,
    })

    if (error) return { error: error.message }
  }

  revalidatePath("/dashboard/payments")
  return { error: null }
}

/* ── Waive Payment ───────────────────────────────────────── */

export async function waivePayment(id: string, reason: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized" }
  }

  if (!reason.trim()) {
    return { error: "Reason is required to waive a payment" }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from("payments")
    .update({
      status: "waived",
      notes: `Waived by ${user.full_name || "admin"}: ${reason}`,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/payments")
  return { error: null }
}

/* ── Send Payment Reminders ──────────────────────────────── */

export async function sendPaymentReminders(period: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "board")) {
    return { error: "Unauthorized", sent: 0 }
  }

  const supabase = createClient()

  // Get all pending/overdue payments for the period with resident + property data
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount, due_date, period, property_id, properties(address), residents(full_name, email)"
    )
    .eq("period", period)
    .in("status", ["pending", "overdue"])

  if (!payments || payments.length === 0) {
    return { error: "No pending/overdue payments found for this period", sent: 0 }
  }

  let sent = 0
  const errors: string[] = []

  for (const p of payments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resident = p.residents as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = p.properties as any

    const email = resident?.email
    if (!email) continue

    try {
      await sendEmail({
        to: email,
        template: "payment-reminder",
        props: {
          residentName: resident?.full_name || "Homeowner",
          propertyAddress: property?.address || "",
          amountDue: `$${Number(p.amount).toFixed(2)}`,
          dueDate: p.due_date
            ? new Date(p.due_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "—",
          period: p.period || "",
        },
      })
      sent++
    } catch (e) {
      errors.push(
        `${email}: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }
  }

  return {
    error: errors.length > 0 ? `${errors.length} emails failed` : null,
    sent,
    total: payments.length,
  }
}
