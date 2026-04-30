import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Pricing — Property Management | Homeowner Hub",
  description:
    "Three plans, priced by doors. Starter $29/mo, Pro $79/mo, Scale custom. Unlimited team members on every plan.",
}

const TIERS = [
  {
    name: "Starter",
    price: "$29",
    cadence: "/mo",
    doors: "Up to 5 doors",
    tagline: "Replace the spreadsheet.",
    cta: "Start free for 14 days",
    href: "/signup?plan=starter",
    featured: false,
  },
  {
    name: "Pro",
    price: "$79",
    cadence: "/mo",
    doors: "Up to 25 doors",
    tagline: "Run it like a business.",
    cta: "Start free for 14 days",
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "",
    doors: "25+ doors",
    tagline: "Run it like a firm.",
    cta: "Talk to sales",
    href: "/contact?topic=scale",
    featured: false,
  },
]

const ALL_PLANS = [
  "Unlimited team members",
  "Unlimited e-signatures",
  "Tenant portal",
  "ACH at 0.8%, card at 2.9%",
  "Maintenance workflow",
  "Vendor management",
]

const PRO_EXTRA = [
  "Vendor portal",
  "Owner statements & multi-owner accounting",
  "Auto-assign rules for maintenance",
  "White-glove data import",
  "Priority email support",
]

const SCALE_EXTRA = [
  "Trust accounting & reconciliation",
  "Same-day ACH",
  "API access",
  "Custom roles & permissions",
  "Dedicated success manager",
  "99.9% uptime SLA",
]

const ADDONS = [
  {
    name: "Eviction Module integration",
    price: "$19/mo",
    body: "Syncs at-risk tenants into the Eviction Management product. Requires a separate Eviction Management subscription.",
  },
  {
    name: "Tenant screening",
    price: "$35 per applicant",
    body: "Credit + criminal + eviction history. Pay per applicant, no subscription.",
  },
  {
    name: "Branded tenant portal",
    price: "$25/mo",
    body: "Your logo, your domain. Available on Pro and above.",
  },
]

const FAQ = [
  {
    q: "Is there an annual discount?",
    a: "Yes — 2 months free when paid annually.",
  },
  {
    q: "What counts as a 'door'?",
    a: "One leasable unit. A duplex = 2 doors. A vacant unit still counts if it's listed.",
  },
  {
    q: "What happens if I exceed my plan's door count?",
    a: "We'll email you and let you upgrade. We don't lock you out.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, monthly. Annual plans prorate the unused months back.",
  },
  {
    q: "Nonprofit or affordable-housing discount?",
    a: "Yes — 30% off Pro and Scale. Email sales.",
  },
]

export default function PricingPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="bg-gradient-to-b from-emerald-50/60 via-white to-white py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pricing</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Priced per portfolio, not per seat.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Add unlimited team members on every plan. Pay for the doors you manage,
              not the people who help you manage them.
            </p>
          </div>
        </section>

        {/* TIERS */}
        <section className="bg-white pb-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col rounded-2xl border bg-white p-6 ${
                  t.featured
                    ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20"
                    : "border-slate-200"
                }`}
              >
                <h3 className="text-base font-semibold text-slate-900">{t.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-slate-900">
                    {t.price}
                  </span>
                  <span className="text-sm text-slate-500">{t.cadence}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{t.doors}</p>
                <p className="mt-3 text-sm font-medium text-slate-700">{t.tagline}</p>
                <Link
                  href={t.href}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium ${
                    t.featured
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* INCLUDED ON ALL PLANS */}
        <section className="border-t border-slate-200 bg-slate-50/40 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Included on every plan
            </h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {ALL_PLANS.map((line) => (
                <li key={line} className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <Card title="Pro adds" items={PRO_EXTRA} />
              <Card title="Scale adds (on top of Pro)" items={SCALE_EXTRA} />
            </div>
          </div>
        </section>

        {/* ADD-ONS */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Add-ons</h2>
            <p className="mt-2 text-base text-slate-600">Optional. Buy them only if you need them.</p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {ADDONS.map((a) => (
                <div key={a.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-base font-semibold text-slate-900">{a.name}</h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700">{a.price}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-200 bg-slate-50/40 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Pricing FAQ</h2>
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

        {/* CTA */}
        <section className="border-t border-slate-200 bg-emerald-600 py-16 text-white">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight">Start in five minutes.</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-emerald-100">
              Free for 14 days. We&apos;ll import your first lease for you if you want.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700">
                Book a 20-min demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700">
            <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
