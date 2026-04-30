import { redirect } from "next/navigation"
import Link from "next/link"

import { getResumeState } from "@/lib/onboarding/progress"
import { Button } from "@/components/ui/button"

export default async function OnboardingHomePage() {
  const resume = await getResumeState()

  // Already completed onboarding for at least one tenant — send them in.
  if (resume.kind === "complete") {
    redirect(`/${resume.progress.tenant.slug}`)
  }

  // In progress — jump to the current step.
  if (resume.kind === "in_progress") {
    const step = resume.progress.current_step || 1
    redirect(`/onboarding/step-${step}`)
  }

  // Brand-new user — start at Step 1.
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome to HOA Pro Hub
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Let&apos;s get your community set up. The wizard has 7 short steps
          and should take under 30 minutes. Your progress saves automatically
          — you can step away and come back any time.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          {[
            "Community profile (name, type, address)",
            "Branding (logo, colors, letterhead)",
            "Properties & residents (CSV, manual, or sample data)",
            "Governing documents (CC&Rs, bylaws, rules)",
            "Letter & email templates",
            "Configuration (fines, dues, rules)",
            "Invite your team",
          ].map((label, i) => (
            <li
              key={label}
              className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-slate-700">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/onboarding/step-1">Start setup</Link>
          </Button>
          <span className="text-xs text-slate-500">
            14-day free trial. No credit card required.
          </span>
        </div>
      </div>
    </div>
  )
}
