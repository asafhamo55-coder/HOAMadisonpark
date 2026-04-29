"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { submitStep5 } from "@/app/actions/onboarding"

export function Step5Form() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onContinue() {
    setError(null)
    startTransition(async () => {
      const r = await submitStep5({ reviewed_template_keys: [], use_defaults: true })
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/onboarding/step-4">← Back</Link>
        </Button>
        <Button onClick={onContinue} disabled={pending}>
          {pending ? "Saving…" : "Use defaults & continue →"}
        </Button>
      </div>
    </div>
  )
}
