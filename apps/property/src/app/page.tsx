import Link from "next/link"
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  FileText,
  Truck,
  Wrench,
  Zap,
} from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Property Management Software for Landlords | Homeowner Hub",
  description:
    "Collect rent, sign leases, manage maintenance, and track vendors — built for landlords with 1 to 200+ doors. Free 14-day trial.",
}

const AUDIENCES = [
  {
    title: "The side-hustle landlord",
    body: "1 to 5 doors. You don't want a CRM — you want rent in the bank by the 5th.",
  },
  {
    title: "The growing portfolio",
    body: "6 to 25 doors. Lease renewals, water bills, and a handyman who only texts.",
  },
  {
    title: "The full-time operator",
    body: "25 to 200+ doors. Vendor compliance, owner statements, and a real audit trail.",
  },
]

const METRICS = [
  { value: "94%", label: "of rent collected on time when tenants use the portal" },
  { value: "6.2 hrs", label: "saved per landlord per month vs. spreadsheets" },
  { value: "<48 hrs", label: "average maintenance close time with vendor auto-assign" },
]

const FEATURES = [
  {
    icon: Building2,
    title: "Properties & units",
    body: "Single-family, duplex, 12-unit walk-up, mixed-use storefront — model anything.",
    href: "/features/properties",
  },
  {
    icon: FileText,
    title: "Leases",
    body: "E-sign, renew, end-of-term — no DocuSign seat required.",
    href: "/features/leases",
  },
  {
    icon: CreditCard,
    title: "Rent",
    body: "ACH and card. Late fees on autopilot. Owner statements built in.",
    href: "/features/rent",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    body: "Tenant submits, you assign, vendor closes the loop. Photo uploads + auto-assign.",
    href: "/features/maintenance",
  },
  {
    icon: Truck,
    title: "Vendors",
    body: "Insurance certs, W-9s, and rate cards in one place. 1099 totals at year-end.",
    href: "/features/vendors",
  },
  {
    icon: Zap,
    title: "Utilities",
    body: "Per-unit reads, RUBS allocation, tenant chargebacks.",
    href: "/features/utilities",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "I run 11 units around a full-time engineering job. I used to dread the 1st of the month. Now I check my phone at lunch and rent is just there.",
    name: "Devon Marsh",
    role: "Marsh Family Rentals — Cleveland, OH",
  },
  {
    quote:
      "We migrated 84 doors off Buildium in a weekend. The vendor insurance tracking alone is worth the Pro plan.",
    name: "Priya Shah",
    role: "COO, Fielding Partners",
  },
  {
    quote: "The tenant portal stopped 90% of 'did you get my rent?' texts.",
    name: "Marcus Boone",
    role: "Owner-operator, 6 doors — Atlanta, GA",
  },
  {
    quote:
      "It's the first PM tool that didn't make me feel like I'd been handed a CRM and told to figure it out.",
    name: "Jen Halberg",
    role: "Maple & Vine Rentals",
  },
]

const FLOW = [
  { stage: "List unit", body: "Add property, units, rent, photos. Listing-ready in five minutes." },
  { stage: "Sign lease", body: "Send for e-signature. Tenant signs on their phone in under two minutes." },
  { stage: "Collect rent", body: "Autopay opt-in during signing. Late fees fire themselves on the rules you set." },
  { stage: "Handle requests", body: "Tenant submits with photos. You assign. Vendor closes the loop." },
  { stage: "Renew or turn", body: "Automatic renewal notices. Move-out itemization. Final utility chargebacks." },
]

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            Property Management, by Homeowner Hub
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            The rental software that respects your weekends.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Collect rent, sign leases, dispatch maintenance, and track every unit —
            without spreadsheets, sticky notes, or a property manager taking 8% off the top.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Start free for 14 days <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Book a 20-min demo
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Used by 2,400+ landlords across 38 states · No credit card to start · SOC 2 Type I
          </p>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Built for the landlord who has a day job</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              From one duplex to two hundred doors.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="text-4xl font-semibold tracking-tight text-emerald-700">{m.value}</div>
                <div className="mt-3 text-sm text-slate-600">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">What it does</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Six places it shows up in your week.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 group-hover:gap-2">
                    Learn more <ArrowRight className="h-3.5 w-3.5 transition-all" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">How it fits together</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              List → Sign → Collect → Handle → Renew.
            </h2>
          </div>
          <ol className="mt-12 grid gap-3 md:grid-cols-5">
            {FLOW.map((f, i) => (
              <li key={f.stage} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Step {i + 1}
                </div>
                <div className="mt-1.5 text-base font-semibold text-slate-900">{f.stage}</div>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <blockquote className="text-base leading-relaxed text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <span className="text-slate-500"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pricing</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Priced per portfolio, not per seat.
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Starter $29/mo · Pro $79/mo · Scale custom. Unlimited team members on every plan.
          </p>
          <div className="mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              See pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-slate-200 bg-emerald-600 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your 1st-of-the-month, automated.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100">
            Free for 14 days. No credit card. Your first lease imported by us if you want it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Book a 20-min demo
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
