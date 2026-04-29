"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitStep2 } from "@/app/actions/onboarding"

export function Step2Form({ initial }: { initial: Record<string, unknown> | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [primary, setPrimary] = useState(String((initial?.primary_color as string) ?? "#0F2A47"))
  const [accent, setAccent] = useState(String((initial?.accent_color as string) ?? "#10B981"))

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await submitStep2(Object.fromEntries(formData.entries()))
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  return (
    <form action={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="primary_color">Primary color</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input id="primary_color" name="primary_color" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-16 cursor-pointer p-1" />
            <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="flex-1 font-mono" />
          </div>
        </div>
        <div>
          <Label htmlFor="accent_color">Accent color</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input id="accent_color" name="accent_color" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-16 cursor-pointer p-1" />
            <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="flex-1 font-mono" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input id="logo_url" name="logo_url" type="url" defaultValue={String(initial?.logo_url ?? "")} placeholder="https://… or upload later in Settings" />
        </div>
        <div>
          <Label htmlFor="letterhead_url">Letterhead PDF URL</Label>
          <Input id="letterhead_url" name="letterhead_url" type="url" defaultValue={String(initial?.letterhead_url ?? "")} placeholder="https://… or upload later" />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Live preview</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded" style={{ background: primary }} />
          <div className="h-10 w-10 rounded" style={{ background: accent }} />
          <span className="text-sm text-slate-600">These will theme your dashboard, emails, and letters.</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        File upload UI is coming soon — for now you can paste hosted URLs or skip and configure later in <span className="font-medium">Settings → Branding</span>.
      </p>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save & continue →"}
        </Button>
      </div>
    </form>
  )
}
