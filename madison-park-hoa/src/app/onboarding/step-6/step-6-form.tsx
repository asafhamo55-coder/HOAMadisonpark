"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitStep6 } from "@/app/actions/onboarding"

export function Step6Form({ initial }: { initial: Record<string, unknown> | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const init = initial ?? {}

  function onSubmit(formData: FormData) {
    setError(null)
    const data = Object.fromEntries(formData.entries())
    // Convert checkbox to boolean
    data.leasing_open = formData.get("leasing_open") === "on" ? "true" : "false"
    startTransition(async () => {
      const r = await submitStep6(data)
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  return (
    <form action={onSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Section title="Dues & late fees">
        <Field label="Monthly dues (cents)" name="monthly_dues_cents" type="number" defaultValue={String(init.monthly_dues_cents ?? 0)} hint="0 if you don't charge dues. e.g., 12500 = $125.00" />
        <Field label="Late fee (cents)" name="late_fee_cents" type="number" defaultValue={String(init.late_fee_cents ?? 2500)} />
        <Field label="Grace period (days)" name="grace_period_days" type="number" defaultValue={String(init.grace_period_days ?? 15)} />
      </Section>

      <Section title="Fines">
        <Field label="First offense (cents)" name="fine_first_offense_cents" type="number" defaultValue={String(init.fine_first_offense_cents ?? 2500)} />
        <Field label="Repeat offense (cents)" name="fine_repeat_cents" type="number" defaultValue={String(init.fine_repeat_cents ?? 5000)} />
      </Section>

      <Section title="Leasing rules">
        <div className="flex items-center gap-2 md:col-span-3">
          <input id="leasing_open" name="leasing_open" type="checkbox" defaultChecked={(init.leasing_open as boolean) ?? true} className="h-4 w-4 rounded border-slate-300" />
          <Label htmlFor="leasing_open" className="font-normal">Leasing is open (uncheck for a leasing cap)</Label>
        </div>
        <Field label="Cap %" name="leasing_cap_pct" type="number" defaultValue={String(init.leasing_cap_pct ?? 15)} />
        <Field label="Min lease term (months)" name="leasing_min_term_months" type="number" defaultValue={String(init.leasing_min_term_months ?? 12)} />
      </Section>

      <div className="flex justify-between pt-2">
        <Button variant="outline" asChild>
          <Link href="/onboarding/step-5">← Back</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save & continue →"}
        </Button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">{children}</div>
    </div>
  )
}

function Field({ label, name, type = "text", defaultValue, hint }: { label: string; name: string; type?: string; defaultValue?: string; hint?: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
