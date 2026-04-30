"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveBranding } from "@/app/actions/tenant-settings"

type FormState = {
  primary: string
  accent: string
  logo_url: string
  letterhead_url: string
  login_image_url: string
}

export function BrandingForm({ initial }: { initial: FormState }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState<FormState>(initial)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await saveBranding({
        primary: form.primary,
        accent: form.accent,
        logo_url: form.logo_url || null,
        letterhead_url: form.letterhead_url || null,
        login_image_url: form.login_image_url || null,
      })
      if (res.ok) {
        toast.success("Branding saved — reload to see the change app-wide")
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={onSubmit}>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label="Primary color"
          value={form.primary}
          onChange={(v) => set("primary", v)}
          help="Used for navigation, primary buttons, and email headers."
        />
        <ColorField
          label="Accent color"
          value={form.accent}
          onChange={(v) => set("accent", v)}
          help="Used for highlights, links, and call-to-action accents."
        />
      </fieldset>

      <Field
        label="Logo URL"
        help="Recommended: 200×60 PNG with transparent background."
      >
        <Input
          value={form.logo_url}
          onChange={(e) => set("logo_url", e.target.value)}
          placeholder="https://…/logo.png"
        />
      </Field>

      <Field
        label="Letterhead URL"
        help="Used at the top of generated PDF letters (e.g. violation notices)."
      >
        <Input
          value={form.letterhead_url}
          onChange={(e) => set("letterhead_url", e.target.value)}
          placeholder="https://…/letterhead.png"
        />
      </Field>

      <Field
        label="Login screen image URL"
        help="Optional background image shown on the resident login page."
      >
        <Input
          value={form.login_image_url}
          onChange={(e) => set("login_image_url", e.target.value)}
          placeholder="https://…/login-bg.jpg"
        />
      </Field>

      {/* Live preview */}
      <section
        className="rounded-lg border border-slate-200 p-4"
        aria-label="Live preview"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Live preview
        </p>
        <div
          className="flex items-center justify-between rounded-md p-4 text-white"
          style={{ background: form.primary }}
        >
          <span className="font-semibold">{form.primary}</span>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: form.accent }}
          >
            Sample button
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </form>
  )
}

function ColorField({
  label,
  value,
  onChange,
  help,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  help?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-200"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
          placeholder="#0F2A47"
        />
      </div>
      {help ? <p className="text-xs text-slate-500">{help}</p> : null}
    </div>
  )
}

function Field({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {help ? <p className="text-xs text-slate-500">{help}</p> : null}
    </div>
  )
}
