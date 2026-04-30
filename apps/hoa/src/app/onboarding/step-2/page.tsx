import { redirect } from "next/navigation"
import { getResumeState } from "@/lib/onboarding/progress"
import { Step2Form } from "./step-2-form"

export const metadata = { title: "Step 2 — Branding" }

export default async function Step2Page() {
  const resume = await getResumeState()
  if (resume.kind === "none") redirect("/onboarding/step-1")
  if (resume.kind === "complete") redirect(`/${resume.progress.tenant.slug}`)
  if (!resume.progress.step1_done) redirect("/onboarding/step-1")

  const initial = (resume.progress.step2_data ?? null) as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Step 2 — Branding</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick colors and (optionally) a logo + letterhead. You can refine these later in Settings.
        </p>
      </div>
      <Step2Form initial={initial} />
    </div>
  )
}
