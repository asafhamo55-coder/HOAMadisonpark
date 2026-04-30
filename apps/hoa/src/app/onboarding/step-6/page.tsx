import { redirect } from "next/navigation"
import { getResumeState } from "@/lib/onboarding/progress"
import { Step6Form } from "./step-6-form"

export const metadata = { title: "Step 6 — Configuration" }

export default async function Step6Page() {
  const resume = await getResumeState()
  if (resume.kind === "none") redirect("/onboarding/step-1")
  if (resume.kind === "complete") redirect(`/${resume.progress.tenant.slug}`)
  if (!resume.progress.step1_done) redirect("/onboarding/step-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Step 6 — Configuration</h1>
        <p className="mt-1 text-sm text-slate-600">
          Defaults below match Madison Park&apos;s schedule. Adjust anything that doesn&apos;t fit; you can refine all of this
          in <span className="font-medium">Settings → Finance / Rules</span> later.
        </p>
      </div>
      <Step6Form initial={(resume.progress.step6_data ?? null) as Record<string, unknown> | null} />
    </div>
  )
}
