import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Pricing | Eviction Management",
  description:
    "$99 practitioner, $199 landlord (GA), $499 multi-state Pro, custom enterprise. No per-case fees.",
}

const TIERS = [
  {
    name: "Practitioner",
    price: "$99",
    cadence: "/mo per seat",
    body: "Solo attorneys and small firms running cases in supported jurisdictions.",
    cta: "Book a walkthrough",
    href: "/contact?plan=practitioner",
    featured: true,
  },
  {
    name: "Landlord",
    price: "$199",
    cadence: "/mo",
    body: "Owner-operators and small property managers. Unlimited cases. Georgia only.",
    cta: "Book a walkthrough",
    href: "/contact?plan=landlord",
    featured: false,
  },
  {
    name: "Pro",
    price: "$499",
    cadence: "/mo",
    body: "Multi-state firms and larger property management operators.",
    cta: "Book a walkthrough",
    href: "/contact?plan=pro",
    featured: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    body: "Regional firms, institutional landlords, multi-office deployments — SSO, custom playbooks, BAA-equivalent agreements.",
    cta: "Talk to sales",
    href: "/contact?plan=enterprise",
    featured: false,
  },
]

const INCLUDED = [
  "Computed deadlines",
  "Document generation",
  "Audit trail",
  "Case files",
  "Overdue-first dashboard",
  "Email support",
]

const FAQ = [
  {
    q: "Is there a per-case fee?",
    a: "No.",
  },
  {
    q: "What counts as a seat?",
    a: "One named user.",
  },
  {
    q: "Can I downgrade?",
    a: "Yes, at the next billing period. Case data is preserved.",
  },
  {
    q: "What if my jurisdiction isn't live?",
    a: "You can still run cases manually, but computed-deadline guarantees apply only to supported jurisdictions.",
  },
  {
    q: "Refunds?",
    a: "Pro-rated within the first 30 days.",
  },
]

export default function PricingPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-gradient-to-b from-slate-50 via-white to-white py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Pricing</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Pricing that matches how you practice.
            </h1>
            <p className="mt-4 text-base text-slate-600">
              Per-practitioner, per-landlord, or multi-state. No per-case fees.
            </p>
          </div>
        </section>

        <section className="bg-white pb-16">
          <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col rounded-2xl border bg-white p-6 ${
                  t.featured ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                }`}
              >
                <h3 className="text-base font-semibold text-slate-900">{t.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-slate-900">
                    {t.price}
                  </span>
                  <span className="text-xs text-slate-500">{t.cadence}</span>
                </div>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600">{t.body}</p>
                <Link
                  href={t.href}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium ${
                    t.featured
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50/40 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              What&apos;s in every plan
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map((line) => (
                <li key={line} className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-rose-600" /> {line}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm leading-relaxed text-slate-600">
              <strong>Add-on jurisdiction packs (post-launch):</strong> Once a jurisdiction
              is live, Practitioner and Landlord plans can add it as a pack. Pro includes
              all live jurisdictions.
            </p>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">FAQ</h2>
            <dl className="mt-8 space-y-6">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="text-base font-medium text-slate-900">{f.q}</dt>
                  <dd className="mt-1 text-sm text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-rose-600 py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight">Start with a walkthrough.</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-rose-100">
              Twenty minutes on a real case in your jurisdiction.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Book a walkthrough <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
