import Link from "next/link"
import { ArrowRight, Check, Clock, FileText, Map, ShieldCheck } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Eviction case management software | Eviction Management",
  description:
    "Per-jurisdiction playbooks, computed deadlines, and court-ready documents for landlords, property managers, and eviction counsel.",
}

const STAGES = [
  {
    label: "Notice to vacate / demand for possession",
    body: "Case opened. Tenant, property, and lease terms captured. Demand generated and logged with method of delivery.",
  },
  {
    label: "Demand period elapsed",
    body: "System waits the statutory period and unlocks the next stage only when the clock is satisfied.",
  },
  {
    label: "Dispossessory affidavit filed",
    body: "Affidavit generated from case data, filed with the magistrate court, filing receipt uploaded to the case file.",
  },
  {
    label: "Service of process",
    body: "Sheriff or marshal service tracked. Service date drives the answer-day calculation.",
  },
  {
    label: "Answer period",
    body: "Seven-day window monitored. If tenant answers, case routes to contested track; if not, default judgment is prepared.",
  },
  {
    label: "Hearing or default judgment",
    body: "Hearing date, judge, and outcome logged. Money judgment and possession judgment captured separately.",
  },
  {
    label: "Writ of possession",
    body: "Writ requested, issued, and executed. Possession date and any post-judgment events recorded to the audit trail.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "We were running dispossessory out of a shared spreadsheet and a wall calendar. Switching to a county playbook took the deadline math off my desk.",
    name: "Marcus Whelan, Esq.",
    role: "Whelan & Pace LLC — DeKalb County",
  },
  {
    quote:
      "I manage 280 doors across Conyers and Lithonia. The dashboard surfacing overdue cases first is the single most useful screen I open on Monday.",
    name: "Priya Raman",
    role: "Director of Operations, Stonecrest Residential — Rockdale County",
  },
  {
    quote:
      "The audit trail alone is worth it. When opposing counsel challenged service, I exported the case file and we were done.",
    name: "Renee Caldwell, Esq.",
    role: "Caldwell Law Group — Rockdale County",
  },
  {
    quote:
      "I'm a landlord with four units. I needed to do this right, not fast. The walkthrough kept me from filing the wrong affidavit twice.",
    name: "Daniel Okafor",
    role: "Owner-operator — DeKalb County",
  },
]

const TIERS = [
  { name: "Practitioner", price: "$99", cadence: "/mo per seat", body: "Solo attorneys and small firms in supported jurisdictions" },
  { name: "Landlord", price: "$199", cadence: "/mo", body: "Owner-operators and small property managers, unlimited cases — Georgia only" },
  { name: "Pro", price: "$499", cadence: "/mo", body: "Multi-state firms and larger property managers" },
  { name: "Enterprise", price: "Custom", cadence: "", body: "Regional firms and institutional landlords — SSO, custom playbooks" },
]

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              For landlords, property managers, and eviction counsel
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Run dispossessory cases the way the statute actually reads.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Eviction Management turns each jurisdiction&apos;s forms, deadlines, and notice
              rules into a working playbook — so nothing slips, and every action is on
              the record.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-6 py-3 text-sm font-medium text-white hover:bg-rose-700"
              >
                Book a 20-minute walkthrough <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/jurisdictions"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                See supported jurisdictions
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Built with practicing Georgia attorneys. Launching in Rockdale County and DeKalb County (Decatur).
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            A missed three-day cure resets the case. A wrong affidavit gets it dismissed.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600">
            Eviction law is hyperlocal. State statute, county practice, and individual judges&apos;
            standing orders pull in different directions. Most teams manage it in a spreadsheet,
            a calendar, and memory — and the cost of one missed deadline is weeks of rework, an
            unhappy owner, and sometimes sanctions.
          </p>
        </div>
      </section>

      {/* THE ANSWER */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">The answer</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              One playbook per jurisdiction. The right step, the right deadline, the right form.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Map}
              title="Per-county rules"
              body="Notice periods, filing windows, and answer-day math encoded for each supported county."
            />
            <FeatureCard
              icon={Clock}
              title="Computed deadlines"
              body="Service date in, cure deadline, answer deadline, and hearing window out — recalculated when facts change."
            />
            <FeatureCard
              icon={FileText}
              title="Generated documents"
              body="Demand letters, dispossessory affidavits, and writs of possession populated from case data."
            />
          </div>
        </div>
      </section>

      {/* GA WALKTHROUGH */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">How a case moves</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              A Georgia case, end to end.
            </h2>
          </div>
          <ol className="mt-12 space-y-4">
            {STAGES.map((s, i) => (
              <li key={s.label} className="flex gap-5 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-700">
                  {i + 1}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">{s.label}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm italic text-slate-500">
            Each transition is timestamped, attributed, and preserved. If a judge asks how you got here, you can show them.
          </p>
        </div>
      </section>

      {/* AUDIT TRAIL */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Audit trail and case file</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Every event logged. Every document filed.
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  "Timestamped event log for every transition",
                  "Uploaded service returns and court filings",
                  "Chain-of-custody for generated documents",
                  "Export the full case record as a single PDF bundle",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-rose-600" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 font-mono text-xs">
              <div className="text-slate-400">CASE-2026-0142 · audit log</div>
              <div className="mt-3 space-y-2 text-slate-700">
                <div>2026-04-12 09:14  case_opened   → demand_for_possession</div>
                <div>2026-04-12 09:18  notice_served (certified mail #70213860...)</div>
                <div>2026-04-19 09:18  transition    → file_dispossessory</div>
                <div>2026-04-19 14:02  filing_submitted (Magistrate, Rockdale)</div>
                <div>2026-04-19 16:40  filing_receipt uploaded (rec_2026_8821.pdf)</div>
                <div>2026-04-21 11:05  service_completed (date drives answer)</div>
                <div>2026-04-28 11:05  transition    → answer_period</div>
                <div className="text-rose-700">2026-04-28 11:05  deadline_set answer due 2026-05-05</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Who it&apos;s for</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Three audiences, one operating system.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { title: "Eviction counsel", body: "Caseload visibility across clients, court-ready filings, defensible audit trail." },
              { title: "Property managers", body: "Owner reporting, hand-off to counsel, status visible at a glance." },
              { title: "Independent landlords", body: "One or two cases at a time — done correctly, without filing the wrong affidavit twice." },
            ].map((a) => (
              <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <blockquote className="text-base leading-relaxed text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <div className="text-slate-500">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Per-practitioner, per-landlord, or multi-state.
            </h2>
            <p className="mt-3 text-base text-slate-600">No per-case fees.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {TIERS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold tracking-tight text-slate-900">{t.price}</span>
                  <span className="text-xs text-slate-500">{t.cadence}</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{t.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-rose-700 hover:underline"
            >
              See pricing details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-slate-200 bg-rose-600 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See it on a real case.</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-rose-100">
            Twenty minutes. We&apos;ll walk a sample dispossessory case from notice to writ in your jurisdiction.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Book a walkthrough <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  )
}
