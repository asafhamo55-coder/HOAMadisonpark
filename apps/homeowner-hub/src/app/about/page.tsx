import Link from "next/link"
import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "About — Homeowner Hub",
  description:
    "Why Homeowner Hub is three independent products instead of one suite — and the four principles that hold across all of them.",
}

const PRINCIPLES = [
  {
    name: "Purpose-built.",
    body: "Each product is shaped around one operator's workflow — a board treasurer, a landlord, an eviction paralegal. We refuse to merge schemas just because two customers happen to use the same word.",
  },
  {
    name: "Exportable data.",
    body: "Every product ships a clean CSV and JSON export of your own records, available from day one. Leaving is a button, not a support ticket.",
  },
  {
    name: "No platform fee.",
    body: "You're billed by the product you use, on the plan you chose. No umbrella surcharge. No 'ecosystem' upsell.",
  },
  {
    name: "Independent uptime.",
    body: "Each product runs on its own infrastructure, its own deploy pipeline, and its own status page. An incident in one cannot cascade into another.",
  },
]

const PROOF_POINTS = [
  {
    title: "Three subdomains, three codebases.",
    body: "hoa.homeowner-hub.app, property.homeowner-hub.app, and eviction.homeowner-hub.app are separate Next.js apps with separate Postgres databases.",
  },
  {
    title: "Three signups, three bills.",
    body: "No shared account. Cancel one without touching the others.",
  },
  {
    title: "Three status pages.",
    body: "An incident on one is logged and resolved on its own page; the other two keep running.",
  },
  {
    title: "One support standard.",
    body: "Different inbox per product, same response-time commitment, same escalation path to the team that wrote the code.",
  },
]

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back home</Link>

        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Three products. One philosophy. No suite.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Homeowner Hub is an umbrella brand. It doesn&apos;t host data, it doesn&apos;t have
          a login, and it doesn&apos;t sell anything by itself. It exists for one reason:
          to make it obvious that the three products underneath it — HOA Management Hub,
          Property Management, and Eviction Management — are built by the same team, to
          the same standard, with the same view of what software should do for the
          people who run residential property.
        </p>

        {/* PRINCIPLES */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What we commit to, across all three products
          </h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <dt className="text-base font-semibold text-slate-900">{p.name}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* THE CASE AGAINST THE SUITE */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            The case against the suite
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            The default move in this category is the suite — one login, one database,
            one bill, one bloated dashboard that tries to serve a board treasurer, a
            leasing agent, and a paralegal with the same five tabs. It&apos;s a sales
            construct, not a product decision. It exists because vendors want larger
            contracts, not because operators want larger software.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Three things break inside that model:
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-base text-slate-700">
            <li>
              <strong>The schema gets confused.</strong> A &quot;property&quot; in an HOA is a
              lot with an owner. A &quot;property&quot; in rentals is a unit with a tenant.
              Forcing them into one table means every screen has to ask which kind it
              is. The product gets slower; the operator gets less sure of what
              they&apos;re looking at.
            </li>
            <li>
              <strong>The pricing gets dishonest.</strong> The features you actually need
              migrate up the tier ladder until you&apos;re paying for two products to get one.
            </li>
            <li>
              <strong>The blast radius gets large.</strong> A bad migration on the rentals
              side takes down the HOA&apos;s payment portal. That&apos;s not a hypothetical —
              it&apos;s the standard outage post-mortem in this industry.
            </li>
          </ol>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            We split the products instead.
          </p>
        </section>

        {/* WHO BUILT IT */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Built by the Homeowner Hub team, for one HOA first
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Homeowner Hub started in Georgia, with a single community:{" "}
            <strong>Madison Park HOA</strong>. They were the founding customer for the
            HOA product, and a lot of the design decisions you see in HOA Management Hub
            today — the dues ledger, the violation letter flow, the resident portal —
            were shaped against their real board meetings, real budgets, and real
            residents.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            The Property Management product came next, because the same team kept
            hearing the same question from landlords. Eviction Management followed,
            because the same team kept hearing it from the attorneys those landlords
            called. Three products, one team, one operating philosophy.
          </p>
          <blockquote className="mt-6 rounded-r-md border-l-4 border-emerald-500 bg-emerald-50/50 px-5 py-4 italic text-slate-700">
            Build the smallest thing that does the job. Let the data go when the customer goes.
            Pick up the phone when something is broken.
          </blockquote>
        </section>

        {/* INDEPENDENCE PROOF */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Independent isn&apos;t a marketing word. Here&apos;s the proof.
          </h2>
          <ul className="mt-6 space-y-3">
            {PROOF_POINTS.map((p) => (
              <li key={p.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                <div className="mt-1 text-sm text-slate-600">{p.body}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <p className="text-base font-medium text-slate-900">Not sure which product you need?</p>
          <Link
            href="/#wizard"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            Use the wizard →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
