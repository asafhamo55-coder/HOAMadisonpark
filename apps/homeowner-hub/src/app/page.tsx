import Link from "next/link"
import { ArrowRight, Building, Building2, Check, Gavel } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Wizard } from "@/components/wizard"

const PRODUCTS = [
  {
    slug: "hoa",
    name: "HOA Management Hub",
    tag: "Run the association.",
    blurb:
      "Properties, residents, violations, ARC requests, dues, letters, and a resident portal. For HOAs, condos, and master-planned communities.",
    href: process.env.NEXT_PUBLIC_HOA_URL ?? "https://hoa.homeowner-hub.app",
    icon: Building2,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    slug: "property",
    name: "Property Management",
    tag: "Run the rentals.",
    blurb:
      "Units, tenants, leases, rent, vendors, utilities, maintenance. For landlords and small property managers.",
    href: process.env.NEXT_PUBLIC_PROPERTY_URL ?? "https://property.homeowner-hub.app",
    icon: Building,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    slug: "eviction",
    name: "Eviction Management",
    tag: "Run the case.",
    blurb:
      "Stage-by-stage workflow modeled per state and county. Live in Georgia (Rockdale + DeKalb). For attorneys, paralegals, and self-represented landlords.",
    href: process.env.NEXT_PUBLIC_EVICTION_URL ?? "https://eviction.homeowner-hub.app",
    icon: Gavel,
    accent: "bg-rose-50 text-rose-600",
  },
] as const

const COMPARISON_ROWS = [
  { label: "Track owners, lots, and board members", hoa: true, property: false, eviction: false },
  { label: "Bill recurring dues or assessments", hoa: true, property: false, eviction: false },
  { label: "Issue CC&Rs violation letters and run ARC reviews", hoa: true, property: false, eviction: false },
  { label: "Track tenants, leases, and rent", hoa: false, property: true, eviction: false },
  { label: "Log maintenance requests and dispatch vendors", hoa: "limited", property: true, eviction: false },
  { label: "Run a per-jurisdiction eviction with deadlines and notices", hoa: false, property: false, eviction: true },
  { label: "Generate state-specific legal notices (e.g., dispossessory)", hoa: false, property: false, eviction: true },
  { label: "Self-serve portal for residents or tenants", hoa: "owners", property: "tenants", eviction: false },
  { label: "Export your own data without asking us", hoa: true, property: true, eviction: true },
] as const

const PRINCIPLES = [
  {
    name: "Purpose-built beats general-purpose.",
    body: "An HOA board, a landlord, and an eviction paralegal use different nouns, different verbs, and different deadlines. Forcing them into one schema makes everyone slower.",
  },
  {
    name: "You only pay for the job in front of you.",
    body: "No platform fee. No 'starter tier' with the feature you actually need locked behind an enterprise call.",
  },
  {
    name: "Independent uptime.",
    body: "A bug in Eviction Management cannot take down your HOA's payment portal. They don't share a database, a deploy pipeline, or a status page.",
  },
  {
    name: "Your data leaves when you do.",
    body: "Each product exports cleanly to CSV and JSON. We don't hold reporting hostage as a retention tactic.",
  },
] as const

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-20 text-center sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            The umbrella for three independent products
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            One brand. Three products. Buy only what you actually run.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Homeowner Hub fronts three SaaS products for the people who run residential
            property — HOA boards, landlords, and eviction practitioners. Each one is
            purpose-built, separately priced, and runs on its own stack. We don&apos;t
            sell a suite. We sell whichever of the three matches the job in front of you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#wizard"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Help me pick one <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              I already know — show me the products
            </a>
          </div>
        </div>
      </section>

      {/* WIZARD */}
      <section className="bg-slate-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Routing tool</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Three questions. We&apos;ll point you at one product.
            </h2>
          </div>
          <Wizard />
        </div>
      </section>

      {/* PRODUCT CARDS */}
      <section id="products" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">The platform</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Already know what you need? Pick one.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PRODUCTS.map((p) => {
              const Icon = p.icon
              return (
                <a
                  key={p.slug}
                  href={p.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${p.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{p.name}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{p.tag}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.blurb}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 group-hover:gap-2.5">
                    Open <ArrowRight className="h-4 w-4 transition-all" />
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Which one fits which job?</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Overlap is rare and intentional.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              If you run an HOA that also rents out a few units, that&apos;s two products — not one bigger one. The data stays separate; that&apos;s the point.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">When you need to…</th>
                  <th className="px-4 py-3 text-center font-semibold">HOA Hub</th>
                  <th className="px-4 py-3 text-center font-semibold">Property Mgmt</th>
                  <th className="px-4 py-3 text-center font-semibold">Eviction Mgmt</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="px-4 py-3 text-slate-700">{row.label}</td>
                    <Cell value={row.hoa} />
                    <Cell value={row.property} />
                    <Cell value={row.eviction} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Why three products instead of one bloated suite?
          </h2>
          <dl className="mt-12 space-y-8">
            {PRINCIPLES.map((p) => (
              <div key={p.name} className="border-l-2 border-emerald-500 pl-5">
                <dt className="text-base font-semibold text-slate-900">{p.name}</dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-600">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Built by one team. Sold as three products. On purpose.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-700">
            Homeowner Hub started with a single HOA — Madison Park, in Georgia — needing
            software that didn&apos;t treat them like a 200-unit apartment complex. We built
            the HOA product for them first. The rental and eviction products followed,
            because the same team kept finding the same gap: tools that try to be
            everything end up being mediocre at the one thing you actually came for.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            So we drew a line. Three products, three codebases, three subdomains. One
            philosophy: respect the operator&apos;s time, ship the smallest thing that does
            the job, and let the data go when the customer goes.
          </p>
          <div className="mt-8">
            <a
              href="#wizard"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:gap-2.5"
            >
              Pick a product <ArrowRight className="h-4 w-4 transition-all" />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

function Cell({ value }: { value: boolean | "limited" | "owners" | "tenants" }) {
  if (value === true) {
    return (
      <td className="px-4 py-3 text-center">
        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-hidden="true" />
      </td>
    )
  }
  if (value === false) {
    return <td className="px-4 py-3 text-center text-slate-300">—</td>
  }
  return (
    <td className="px-4 py-3 text-center text-xs text-slate-500">
      {value === "limited" && "Common areas only"}
      {value === "owners" && "Owners"}
      {value === "tenants" && "Tenants"}
    </td>
  )
}
