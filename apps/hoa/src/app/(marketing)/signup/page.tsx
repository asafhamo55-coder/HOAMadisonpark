import type { Metadata } from "next"

import { Section } from "@/components/marketing/section"
import { BRAND, PLANS } from "@/lib/brand"
import { SignupForm } from "./signup-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sign up",
  description: `Start a free 14-day trial of ${BRAND.name}. No credit card required.`,
  alternates: { canonical: `${BRAND.url}/signup` },
  // Auth-flow pages should not be indexed.
  robots: { index: false, follow: false },
}

const VALID_PLANS = PLANS.map((p) => p.slug)

export default function SignupPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const planParam = searchParams.plan?.toLowerCase()
  const initialPlan = (
    VALID_PLANS.includes(planParam as (typeof VALID_PLANS)[number])
      ? planParam
      : "trial"
  ) as (typeof VALID_PLANS)[number]

  return (
    <Section className="!pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Start your community on {BRAND.name}
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
          Create your account.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
          14 days free. No credit card. We&apos;ll create your admin login
          and walk you through tenant setup on the next screen.
        </p>
      </div>

      <div className="mt-12">
        <SignupForm initialPlan={initialPlan} />
      </div>
    </Section>
  )
}
