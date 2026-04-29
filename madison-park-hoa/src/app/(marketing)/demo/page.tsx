import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Section, SectionHeading } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Live demo",
  description: `A clickable tour of ${BRAND.name} — see the dashboard, properties, violations, and resident portal without signing up.`,
  alternates: { canonical: `${BRAND.url}/demo` },
}

const STEPS = [
  {
    label: "Dashboard",
    body: "Open violations, past-due dues, and unread requests at a glance. Click any card to drill into the underlying records.",
  },
  {
    label: "Properties",
    body: "Search by address or owner. Each property profile shows residents, vehicles, violations, payments, and uploaded documents.",
  },
  {
    label: "Violations",
    body: "Photo-driven inspection with one-tap letter generation. Status moves from open → notice → fine → ARC review automatically.",
  },
  {
    label: "Resident portal",
    body: "What residents see when they log in: dues balance, open notices, governing-doc search, and ARC submission.",
  },
]

export default function DemoPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Live demo"
          title="Click through the product without giving us your email."
          subtitle="A read-only walkthrough of the key screens, populated with sample data from the Madison Park demo tenant."
        />

        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-slate-900/5">
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-slate-400">
              {BRAND.name} · demo
            </span>
          </div>
          <div
            className="grid place-items-center rounded-md bg-slate-50 p-12 text-center"
            style={{ aspectRatio: "16 / 9" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Interactive tour
              </p>
              <h3 className="mt-2 font-display text-2xl text-slate-700">
                Demo screenshots load here
              </h3>
              <p className="mt-3 max-w-md text-sm text-slate-500">
                Click through the four steps below — each one swaps in a
                screenshot with annotated callouts. (Loading screenshots is
                deferred to the asset pipeline; the placeholder is here so the
                page is ready the moment they ship.)
              </p>
            </div>
          </div>
        </div>

        <ol className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold text-emerald-700">
                Step {i + 1}
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-900">
                {s.label}
              </h4>
              <p className="mt-2 text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section bordered muted>
        <div className="mx-auto max-w-3xl rounded-3xl bg-[var(--tenant-primary)] p-12 text-center text-white">
          <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Ready to load your own data?
          </h2>
          <p className="mt-3 text-sm text-white/80">
            Spin up a real tenant in five minutes — sample data is preloaded so
            you don&apos;t start with an empty board.
          </p>
          <div className="mt-6">
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
          </div>
        </div>
      </Section>
    </>
  )
}
