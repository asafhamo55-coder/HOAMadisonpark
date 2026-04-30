"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveRules } from "@/app/actions/tenant-settings"

type FormState = {
  leasing_cap_pct: number | null
  lease_min_term_months: number | null
  pets_allowed: boolean | null
  parking_notes: string
  pet_notes: string
}

export function RulesForm({ initial }: { initial: FormState }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState<FormState>(initial)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await saveRules({
        leasing_cap_pct: form.leasing_cap_pct,
        lease_min_term_months: form.lease_min_term_months,
        pets_allowed: form.pets_allowed,
        parking_notes: form.parking_notes || null,
        pet_notes: form.pet_notes || null,
      })
      if (res.ok) toast.success("Rules saved")
      else toast.error(res.error)
    })
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={onSubmit}>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <Field label="Leasing cap (%)">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.leasing_cap_pct ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                leasing_cap_pct:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="15"
          />
        </Field>
        <Field label="Minimum lease term (months)">
          <Input
            type="number"
            min={0}
            max={120}
            value={form.lease_min_term_months ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                lease_min_term_months:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="12"
          />
        </Field>
      </fieldset>

      <Field label="Pets allowed?">
        <Select
          value={
            form.pets_allowed === null
              ? ""
              : form.pets_allowed
                ? "yes"
                : "no"
          }
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              pets_allowed: v === "yes" ? true : v === "no" ? false : null,
            }))
          }
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Pet rules (free text)">
        <Textarea
          rows={4}
          value={form.pet_notes}
          onChange={(e) => setForm((f) => ({ ...f, pet_notes: e.target.value }))}
          placeholder="Up to 2 dogs per household. Leashes required in common areas. Owners must clean up after pets."
        />
      </Field>

      <Field label="Parking rules (free text)">
        <Textarea
          rows={4}
          value={form.parking_notes}
          onChange={(e) =>
            setForm((f) => ({ ...f, parking_notes: e.target.value }))
          }
          placeholder="Each unit has 2 assigned spots. Guest parking is first-come, first-served. No commercial vehicles."
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save rules"}
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
