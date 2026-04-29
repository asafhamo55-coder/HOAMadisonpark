import Link from "next/link"
import { ArrowRight, Check, FileSearch, FileText, Mail, Sparkles } from "lucide-react"

import { Hero } from "@/components/marketing/hero"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { Faq } from "@/components/marketing/faq"
import { Section, SectionHeading } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { BRAND, FAQ_HOME, PLANS, TESTIMONIALS } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
}

const PAIN_POINTS = [
  {
    pain: "Spreadsheets and Word docs",
    solution:
      "Properties, residents, vehicles, and violation history live in one searchable place — not in Tab 14 of last year's roster.",
    feature: "Property records",
  },
  {
    pain: "Disconnected vendors and email chains",
    solution:
      "Quotes, scheduled work, and invoices live alongside the resident requests that triggered them. The board sees one thread.",
    feature: "Vendor portal",
  },
  {
    pain: "Frustrated residents",
    solution:
      "Residents log in, see their dues, view the latest minutes, and submit ARC requests without waiting for the board's next meeting.",
    feature: "Resident portal",
  },
]

const PRICING_TEASER = PLANS.filter((p) => p.slug !== "trial")

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Logo strip — start with Madison Park, add tenants as they sign up */}
      <Section className="!py-12" bordered>
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          Trusted by community boards across the country
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-base text-slate-400">
          <li className="font-display text-lg font-semibold text-slate-500">
            Madison Park HOA
          </li>
          <li className="text-slate-300">+ early-access pilots launching Q3</li>
        </ul>
      </Section>

      {/* Pain → solution */}
      <Section bordered>
        <SectionHeading
          eyebrow="The problem"
          title="Every board we talk to has the same three problems."
          subtitle="None of them are actually about HOA management. They're about tools that weren't built for the job."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PAIN_POINTS.map((p) => (
            <div
              key={p.pain}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Painful today
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {p.pain}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {p.solution}
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {p.feature}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Feature highlights — uses existing FeatureGrid */}
      <Section muted bordered>
        <SectionHeading
          eyebrow="What's in the box"
          title="Six modules that replace a binder, a spreadsheet, and an inbox."
          subtitle="Every plan includes the basics. Online payments, ARC, and elections light up on Standard. Open API and white-label arrive on Pro."
        />
        <FeatureGrid />
      </Section>

      {/* Knowledge base / full-text search — replaces the AI section */}
      <Section bordered>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Knowledge base
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Your covenants, searchable in plain English.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Drop your CC&Rs, bylaws, and meeting minutes into the
              knowledge base. {BRAND.name} extracts every paragraph and
              indexes it for full-text search — so the next time someone
              asks &quot;can I install a fence on my side yard?&quot;,
              the answer is one search away with the exact clause cited.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {[
                "Upload PDFs, Word docs, and scanned letters",
                "Postgres full-text search across every governing doc",
                "Per-document permissions: board, residents, public",
                "Version history — find what the rule was in 2019",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-none text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button
                asChild
                className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
              >
                <Link href="/features/documents">
                  See the document module
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileSearch className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <input
                disabled
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                value="Can I install a fence on my side yard?"
                readOnly
                aria-label="Sample knowledge base query"
              />
            </div>
            <ul className="mt-4 space-y-3">
              {[
                {
                  title: "CC&Rs — Article VII §3 Fences and Walls",
                  body: "Fences in side yards may not exceed 6 feet and must be approved in writing by the Architectural Review Committee prior to installation.",
                  source: "ccrs-2018-amended.pdf · page 14",
                },
                {
                  title: "Architectural Guidelines §4.2",
                  body: "Side-yard fences shall be of cedar, redwood, or vinyl in approved colors. Chain-link is prohibited except for rear yards screened from view.",
                  source: "arc-guidelines-2022.pdf · page 6",
                },
              ].map((hit) => (
                <li
                  key={hit.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    {hit.title}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">{hit.body}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {hit.source}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">
              Live search results — no AI hallucination, no third-party LLM.
              Just your documents, indexed in Postgres.
            </p>
          </div>
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section muted bordered>
        <SectionHeading
          eyebrow="Pricing"
          title="Three plans, no contracts, no per-resident fees."
          subtitle="Start free for 14 days. Cancel anytime. Annual saves 17%."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PRICING_TEASER.map((plan) => (
            <div
              key={plan.slug}
              className={`rounded-2xl border bg-white p-6 ${
                plan.featured
                  ? "border-[var(--tenant-primary)] shadow-lg ring-2 ring-[var(--tenant-primary)]/15"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="rounded-full bg-[var(--tenant-primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <p className="mt-5">
                <span className="text-3xl font-semibold tracking-tight text-slate-900">
                  ${plan.monthly}
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {plan.properties} · {plan.seats}
              </p>
              <Button
                asChild
                className={`mt-5 w-full ${
                  plan.featured
                    ? "bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
                    : ""
                }`}
                variant={plan.featured ? "default" : "outline"}
              >
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="ghost">
            <Link href="/pricing">
              See full pricing & comparison
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Testimonial */}
      <Section bordered>
        {TESTIMONIALS.map((t) => (
          <figure key={t.author} className="mx-auto max-w-3xl text-center">
            <Sparkles
              className="mx-auto h-7 w-7 text-emerald-500"
              aria-hidden="true"
            />
            <blockquote className="mt-6 font-display text-2xl font-medium leading-relaxed text-slate-900 sm:text-3xl">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{t.author}</span>
              <span className="mx-2 text-slate-300">·</span>
              {t.role}
            </figcaption>
          </figure>
        ))}
      </Section>

      {/* FAQ */}
      <Section muted bordered id="faq">
        <SectionHeading
          eyebrow="Common questions"
          title="What boards ask before they sign up."
        />
        <Faq items={FAQ_HOME} />
      </Section>

      {/* Final CTA */}
      <Section bordered>
        <div className="mx-auto max-w-4xl rounded-3xl bg-[var(--tenant-primary)] p-12 text-center text-white sm:p-16">
          <Mail className="mx-auto h-8 w-8 text-emerald-300" aria-hidden="true" />
          <h2 className="mt-6 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Stop running your community in spreadsheets.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            Spin up a working tenant in under five minutes. Bring real
            data — or start with the sample community we ship with the
            onboarding wizard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white px-8 text-slate-900 hover:bg-slate-100"
            >
              <Link href="/signup">
                Start free 14-day trial
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">Talk to us first</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/60">
            14 days free. No credit card. Cancel anytime.
          </p>
        </div>
      </Section>
    </>
  )
}
