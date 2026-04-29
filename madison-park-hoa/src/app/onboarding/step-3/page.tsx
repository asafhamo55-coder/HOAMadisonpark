import { redirect } from "next/navigation"
import { getResumeState } from "@/lib/onboarding/progress"
import { Step3Form } from "./step-3-form"

export const metadata = { title: "Step 3 — Properties & residents" }

export default async function Step3Page() {
  const resume = await getResumeState()
  if (resume.kind === "none") redirect("/onboarding/step-1")
  if (resume.kind === "complete") redirect(`/${resume.progress.tenant.slug}`)
  if (!resume.progress.step1_done) redirect("/onboarding/step-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Step 3 — Properties &amp; residents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Three ways to populate your community: bulk import, manual entry, or sample data to explore the app first.
        </p>
      </div>
      <Step3Form initial={(resume.progress.step3_data ?? null) as Record<string, unknown> | null} />
    </div>
  )
}
