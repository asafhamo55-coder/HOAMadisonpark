"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { submitStep4 } from "@/app/actions/onboarding"

export function Step4Form() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onContinue(skipped: boolean) {
    setError(null)
    startTransition(async () => {
      const r = await submitStep4({ uploaded_doc_ids: [], skipped })
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Document upload</h3>
        <p className="mt-2 text-sm text-slate-600">
          Document upload UI is wired into the dashboard. Once you finish onboarding, go to{" "}
          <span className="font-medium">Documents → Upload</span> to add your governing docs. Each PDF is text-extracted
          server-side and indexed for full-text search.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 md:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">CC&amp;Rs / Declaration</div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Bylaws</div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Rules &amp; Regulations</div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Architectural guidelines</div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">Articles of incorporation</div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/onboarding/step-3">← Back</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onContinue(true)} disabled={pending}>
            Skip for now
          </Button>
          <Button onClick={() => onContinue(false)} disabled={pending}>
            {pending ? "Saving…" : "Continue →"}
          </Button>
        </div>
      </div>
    </div>
  )
}
