"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitStep1 } from "@/app/actions/onboarding"

const TYPES = [
  { value: "hoa", label: "HOA (Homeowners Association)" },
  { value: "coa", label: "COA (Condo Association)" },
  { value: "master", label: "Master-planned" },
  { value: "townhome", label: "Townhome" },
  { value: "condo", label: "Condominium" },
  { value: "sub", label: "Sub-association" },
] as const

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

export function Step1Form({ initial }: { initial: Record<string, unknown> | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const init = initial ?? {}

  function onSubmit(formData: FormData) {
    setError(null)
    setFieldErrors({})
    const payload = Object.fromEntries(formData.entries())
    startTransition(async () => {
      const result = await submitStep1(payload)
      if (result.ok) {
        router.push(result.next)
      } else {
        setError(result.error)
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormField label="Community name *" name="name" defaultValue={String(init.name ?? "")} error={fieldErrors.name} required />
      <FormField label="Legal name" name="legal_name" defaultValue={String(init.legal_name ?? "")} hint="The legal entity (corporation/association). Optional." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={String(init.type ?? "hoa")}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FormField label="Founded year" name="founded_year" type="number" defaultValue={init.founded_year ? String(init.founded_year) : ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Estimated # of properties" name="property_count_estimate" type="number" defaultValue={init.property_count_estimate ? String(init.property_count_estimate) : ""} />
        <div>
          <Label htmlFor="state">State</Label>
          <Select name="state" defaultValue={String(init.state ?? "")}>
            <SelectTrigger id="state"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormField label="Street address" name="address_line1" defaultValue={String(init.address_line1 ?? "")} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" name="city" defaultValue={String(init.city ?? "")} />
        <FormField label="ZIP" name="zip" defaultValue={String(init.zip ?? "")} />
      </div>

      <details className="rounded-md border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Advanced (URL slug, time zone, fiscal year)</summary>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="URL slug" name="slug_override" placeholder="auto-derived from name" defaultValue={String(init.slug_override ?? "")} hint="Letters, numbers, and hyphens only. Leave blank to auto-derive." error={fieldErrors.slug_override} />
          <FormField label="Time zone" name="time_zone" defaultValue={String(init.time_zone ?? "America/New_York")} />
          <FormField label="Fiscal year start (MM-DD)" name="fiscal_year_start" defaultValue={String(init.fiscal_year_start ?? "01-01")} />
          <FormField label="Currency" name="currency" defaultValue={String(init.currency ?? "USD")} />
        </div>
      </details>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-500">14-day free trial. No credit card required.</span>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating workspace…" : "Create workspace & continue →"}
        </Button>
      </div>
    </form>
  )
}

function FormField({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  hint,
  error,
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
  error?: string
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
