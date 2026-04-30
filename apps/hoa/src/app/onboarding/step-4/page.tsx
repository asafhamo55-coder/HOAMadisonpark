import { redirect } from "next/navigation"
import Link from "next/link"

import { getResumeState } from "@/lib/onboarding/progress"
import { Step4Form } from "./step-4-form"

export const metadata = { title: "Step 4 — Governing documents" }

export default async function Step4Page() {
  const resume = await getResumeState()
  if (resume.kind === "none") redirect("/onboarding/step-1")
  if (resume.kind === "complete") redirect(`/${resume.progress.tenant.slug}`)
  if (!resume.progress.step1_done) redirect("/onboarding/step-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Step 4 — Governing documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload your CC&amp;Rs, bylaws, rules, and architectural guidelines. We extract the text so it&apos;s searchable across
          your community.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Knowledge base entries (structured rules: leasing cap, fence specs, etc.) can be added manually later in{" "}
          <Link href="#" className="underline">Settings → Knowledge base</Link>. We do not use AI to extract them.
        </p>
      </div>
      <Step4Form />
    </div>
  )
}
