import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  getResumeState,
  STEP_TITLES,
  progressPercent,
} from "@/lib/onboarding/progress"
import { OnboardingSidebarLink } from "@/components/onboarding/sidebar-link"

export const metadata = {
  title: "Set up your community — HOA Pro Hub",
  description:
    "Walk through 7 quick steps to launch your community on HOA Pro Hub.",
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?next=/onboarding")
  }

  const resume = await getResumeState()
  const progress = resume.kind === "none" ? null : resume.progress
  const pct = progressPercent(progress)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header / progress bar */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="text-base font-semibold tracking-tight text-slate-900"
            >
              HOA Pro Hub
            </Link>
            <span className="hidden text-xs text-slate-400 md:inline">
              Setup wizard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600">
                {pct}% complete
              </span>
            </div>
            <span className="text-xs text-slate-500">{user.email ?? ""}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar with step list */}
        <aside className="space-y-1">
          <h2 className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Steps
          </h2>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const meta = STEP_TITLES[n]
            const done =
              progress?.[`step${n}_done` as keyof typeof progress] === true
            return (
              <OnboardingSidebarLink
                key={n}
                step={n}
                title={meta.title}
                subtitle={meta.subtitle}
                done={Boolean(done)}
              />
            )
          })}

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-900">Need a break?</p>
            <p className="mt-1">
              Your progress saves automatically. Come back to{" "}
              <span className="font-mono">/onboarding</span> any time to
              resume.
            </p>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
