import { redirect } from "next/navigation"
import Link from "next/link"

import { getResumeState } from "@/lib/onboarding/progress"
import { Step5Form } from "./step-5-form"

export const metadata = { title: "Step 5 — Letter & email templates" }

const SYSTEM_TEMPLATES = [
  { key: "welcome", name: "Welcome letter", desc: "Sent to new residents on move-in." },
  { key: "courtesy_notice", name: "Friendly courtesy notice", desc: "Pre-violation reminder." },
  { key: "first_violation", name: "First violation notice", desc: "Formal notice with deadline." },
  { key: "second_violation", name: "Second violation notice", desc: "Escalation if first not cured." },
  { key: "final_violation", name: "Final notice / fine", desc: "With assessed fine amount." },
  { key: "hearing_invite", name: "Hearing invitation", desc: "Board-meeting attendance request." },
  { key: "payment_reminder", name: "Payment reminder", desc: "Dues balance reminder." },
  { key: "annual_meeting", name: "Annual meeting notice", desc: "Notice of annual board meeting." },
  { key: "general_announcement", name: "General announcement", desc: "Community-wide news." },
]

export default async function Step5Page() {
  const resume = await getResumeState()
  if (resume.kind === "none") redirect("/onboarding/step-1")
  if (resume.kind === "complete") redirect(`/${resume.progress.tenant.slug}`)
  if (!resume.progress.step1_done) redirect("/onboarding/step-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Step 5 — Letter &amp; email templates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Nine system templates ship with HOA Pro Hub. Use them as-is, or customize after onboarding in{" "}
          <Link href="#" className="underline">Settings → Letter templates</Link>.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ul className="divide-y divide-slate-200">
          {SYSTEM_TEMPLATES.map((t) => (
            <li key={t.key} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">{t.name}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                Default
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Step5Form />
    </div>
  )
}
