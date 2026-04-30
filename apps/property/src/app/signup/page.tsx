import Link from "next/link"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Start free trial — Property Management",
  description: "Free for 14 days. No credit card. Your first lease imported by us.",
}

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Start your 14-day trial
        </h1>
        <p className="mt-3 text-base text-slate-600">
          No credit card. Cancel anytime. We&apos;ll import your first lease for you.
        </p>

        <form className="mt-8 grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">Full name</label>
            <input id="name" name="name" required className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
            <input id="email" name="email" type="email" required className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="doors" className="text-sm font-medium text-slate-700">How many doors do you manage?</label>
            <select id="doors" name="doors" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option>1–5</option>
              <option>6–25</option>
              <option>26–100</option>
              <option>100+</option>
            </select>
          </div>
          <button type="submit" className="mt-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            Create account
          </button>
          <p className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-700 hover:underline">Sign in</Link>
          </p>
        </form>

        <p className="mt-10 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Stub.</strong> Authentication and onboarding will be wired up in a follow-up.
          For now this is a marketing-site placeholder.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
