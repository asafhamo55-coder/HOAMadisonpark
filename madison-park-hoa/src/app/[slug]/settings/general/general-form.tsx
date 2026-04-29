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
import { saveIdentity } from "@/app/actions/tenant-settings"
import type { TenantIdentity } from "@/lib/tenant-settings"

const TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
]

export function GeneralForm({ identity }: { identity: TenantIdentity }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState<TenantIdentity>(identity)

  const set = <K extends keyof TenantIdentity>(
    k: K,
    v: TenantIdentity[K],
  ) => setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await saveIdentity(form)
      if (res.ok) toast.success("General settings saved")
      else toast.error(res.error)
    })
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={onSubmit}>
      <Field label="Legal name">
        <Input
          value={form.legal_name ?? ""}
          onChange={(e) => set("legal_name", e.target.value)}
          placeholder="Madison Park Homeowners Association, Inc."
        />
      </Field>
      <Field label="Community type">
        <Select
          value={form.community_type ?? ""}
          onValueChange={(v) => set("community_type", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single_family">Single-family HOA</SelectItem>
            <SelectItem value="condo">Condominium</SelectItem>
            <SelectItem value="townhome">Townhome</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
            <SelectItem value="coop">Co-op</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <Field label="Address line 1">
          <Input
            value={form.address_line1 ?? ""}
            onChange={(e) => set("address_line1", e.target.value)}
          />
        </Field>
        <Field label="Address line 2">
          <Input
            value={form.address_line2 ?? ""}
            onChange={(e) => set("address_line2", e.target.value)}
          />
        </Field>
        <Field label="City">
          <Input
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="State">
          <Input
            value={form.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
          />
        </Field>
        <Field label="ZIP">
          <Input
            value={form.zip ?? ""}
            onChange={(e) => set("zip", e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
      </fieldset>

      <Field label="Primary contact email">
        <Input
          type="email"
          value={form.contact_email ?? ""}
          onChange={(e) => set("contact_email", e.target.value)}
          placeholder="board@yourhoa.com"
        />
      </Field>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <Field label="Fiscal year start (MM-DD)">
          <Input
            value={form.fiscal_year_start ?? ""}
            onChange={(e) => set("fiscal_year_start", e.target.value)}
            placeholder="01-01"
          />
        </Field>
        <Field label="Time zone">
          <Select
            value={form.time_zone ?? ""}
            onValueChange={(v) => set("time_zone", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {TIME_ZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
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
