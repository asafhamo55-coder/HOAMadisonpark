import { redirect } from "next/navigation"
import { getResumeState } from "@/lib/onboarding/progress"
import { Step7Form } from "./step-7-form"

export const metadata = { title: "Step 7 — Invite your team" }

export default async function Step7Page() {
  const resume = await getResumeState()
  if (resume.kind === "none") redirect("/onboarding/step-1")
  if (resume.kind === "complete") redirect(`/${resume.progress.tenant.slug}`)
  if (!resume.progress.step1_done) redirect("/onboarding/step-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Step 7 — Invite your team</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add board members, committee members, or property managers. Each gets an email with a one-click join link. You can
          add residents in bulk later from the Residents page.
        </p>
      </div>
      <Step7Form />
    </div>
  )
}
