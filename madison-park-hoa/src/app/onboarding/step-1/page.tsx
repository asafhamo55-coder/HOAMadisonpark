import { redirect } from "next/navigation"

import { getResumeState } from "@/lib/onboarding/progress"
import { Step1Form } from "./step-1-form"

export const metadata = { title: "Step 1 — Community profile" }

export default async function Step1Page() {
  const resume = await getResumeState()

  // Already done? Send forward.
  if (resume.kind === "in_progress" && resume.progress.step1_done) {
    redirect("/onboarding/step-2")
  }
  if (resume.kind === "complete") {
    redirect(`/${resume.progress.tenant.slug}`)
  }

  const initial =
    resume.kind === "in_progress" ? (resume.progress.step1_data ?? null) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Step 1 — Community profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tell us about your community. We&apos;ll create your trial workspace
          and you can keep going at your own pace.
        </p>
      </div>
      <Step1Form initial={initial as Record<string, unknown> | null} />
    </div>
  )
}
