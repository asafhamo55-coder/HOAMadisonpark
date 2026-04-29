"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveFinance } from "@/app/actions/tenant-settings"

type FormState = {
  dues_amount_cents: number | null
  dues_cadence: "monthly" | "quarterly" | "semi_annual" | "annual" | null
  due_day_of_month: number | null
  late_fee_cents: number | null
  grace_period_days: number | null
}

export function FinanceForm({ initial }: { initial: FormState }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState<FormState>(initial)

  const setNum = <K extends keyof FormState>(k: K, raw: string) => {
    const n = raw.trim() === "" ? null : Number(raw)
    setForm((f) => ({ ...f, [k]: Number.isFinite(n) ? n : null }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await saveFinance(form)
      if (res.ok) toast.success("Finance settings saved")
      else toast.error(res.error)
    })
  }

  const dollars = (cents: number | null) =>
    cents == null ? "" : (cents / 100).toFixed(2)
  const setDollars = (k: "dues_amount_cents" | "late_fee_cents", raw: string) => {
    const n = raw.trim() === "" ? null : Math.round(Number(raw) * 100)
    setForm((f) => ({ ...f, [k]: Number.isFinite(n) ? n : null }))
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={onSubmit}>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <Field label="Dues amount (USD)">
          <Input
            inputMode="decimal"
            value={dollars(form.dues_amount_cents)}
            onChange={(e) => setDollars("dues_amount_cents", e.target.value)}
            placeholder="125.00"
          />
        </Field>
        <Field label="Cadence">
          <Select
            value={form.dues_cadence ?? ""}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                dues_cadence:
                  (v as FormState["dues_cadence"]) || null,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="semi_annual">Semi-annual</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Due day of month (1–28)">
          <Input
            type="number"
            min={1}
            max={28}
            value={form.due_day_of_month ?? ""}
            onChange={(e) => setNum("due_day_of_month", e.target.value)}
          />
        </Field>
        <Field label="Grace period (days)">
          <Input
            type="number"
            min={0}
            max={60}
            value={form.grace_period_days ?? ""}
            onChange={(e) => setNum("grace_period_days", e.target.value)}
          />
        </Field>
        <Field label="Late fee (USD)">
          <Input
            inputMode="decimal"
            value={dollars(form.late_fee_cents)}
            onChange={(e) => setDollars("late_fee_cents", e.target.value)}
            placeholder="25.00"
          />
        </Field>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save finance settings"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
