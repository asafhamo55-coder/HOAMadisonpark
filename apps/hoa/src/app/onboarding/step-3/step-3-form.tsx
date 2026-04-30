"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { createSandboxTenant, submitStep3 } from "@/app/actions/onboarding"

type Mode = "import" | "manual" | "sample"

export function Step3Form({ initial }: { initial: Record<string, unknown> | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<Mode>((initial?.mode as Mode) ?? "import")
  const [error, setError] = useState<string | null>(null)
  const [sandboxLink, setSandboxLink] = useState<string | null>(null)

  function onContinue() {
    setError(null)
    startTransition(async () => {
      const r = await submitStep3({ mode })
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  function onCreateSandbox() {
    setError(null)
    startTransition(async () => {
      const r = await createSandboxTenant()
      if (r.ok && r.slug) {
        setSandboxLink(`/${r.slug}`)
      } else {
        setError(r.error ?? "Sandbox creation failed")
      }
    })
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <ModeCard
          active={mode === "import"}
          title="Bulk import"
          desc="Upload a CSV or Excel of your properties + residents (up to 5,000 rows)."
          onClick={() => setMode("import")}
        />
        <ModeCard
          active={mode === "manual"}
          title="Manual entry"
          desc="Add properties one at a time. Best for small communities."
          onClick={() => setMode("manual")}
        />
        <ModeCard
          active={mode === "sample"}
          title="Sample data"
          desc="Spin up a demo sandbox with 25 fictional properties to explore the app risk-free."
          onClick={() => setMode("sample")}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {mode === "import" && (
          <ImportPanel />
        )}
        {mode === "manual" && (
          <ManualPanel />
        )}
        {mode === "sample" && (
          <SamplePanel pending={pending} onCreate={onCreateSandbox} sandboxLink={sandboxLink} />
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/onboarding/step-2">← Back</Link>
        </Button>
        <Button onClick={onContinue} disabled={pending}>
          {pending ? "Saving…" : "Continue →"}
        </Button>
      </div>
    </div>
  )
}

function ModeCard({ active, title, desc, onClick }: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${active ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-xs text-slate-600">{desc}</p>
    </button>
  )
}

function ImportPanel() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">CSV / Excel import</h3>
      <p className="text-sm text-slate-600">
        Bulk import is wired into the dashboard. Once you finish onboarding, head to{" "}
        <span className="font-medium">Properties → Import</span> to upload your file.
      </p>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
        Drag-and-drop UI coming next iteration. Continue to set up everything else first.
      </div>
      <p className="text-xs text-slate-500">
        Tip: keep one address per row, and we&apos;ll auto-detect &quot;owner_email&quot; / &quot;phone&quot; columns.
      </p>
    </div>
  )
}

function ManualPanel() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Manual entry</h3>
      <p className="text-sm text-slate-600">
        After onboarding, add properties one by one from the Properties page. No setup required here.
      </p>
    </div>
  )
}

function SamplePanel({ pending, onCreate, sandboxLink }: { pending: boolean; onCreate: () => void; sandboxLink: string | null }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Demo sandbox</h3>
      <p className="text-sm text-slate-600">
        Creates a separate &ldquo;Demo Community&rdquo; workspace with 25 fictional properties + residents so you can click around without
        polluting your real data. You can delete it any time.
      </p>
      {sandboxLink ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Sandbox ready! <Link href={sandboxLink} className="font-medium underline">Open it →</Link>
        </div>
      ) : (
        <Button type="button" onClick={onCreate} disabled={pending} variant="secondary">
          {pending ? "Building sandbox…" : "Create sandbox tenant"}
        </Button>
      )}
    </div>
  )
}
