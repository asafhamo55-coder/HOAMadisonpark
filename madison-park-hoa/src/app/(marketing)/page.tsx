import Link from "next/link"
import {
  ArrowRight,
  Building,
  Building2,
  CheckCircle2,
  Gavel,
  ShieldCheck,
} from "lucide-react"

import { Section, SectionHeading } from "@/components/marketing/section"
import { Faq } from "@/components/marketing/faq"
import { Button } from "@/components/ui/button"
import { BRAND, FAQ_HOME, PRODUCTS } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata = {
  title: `${BRAND.name} — Homeowner Hub: HOA, Property & Eviction Management`,
  description:
    "One platform for homeowners and property managers: HOA Hub, Property Management, and Eviction Hub. Run all three from a single account.",
}

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  hoa: <Building2 className="h-6 w-6" />,
  property: <Building className="h-6 w-6" />,
  eviction: <Gavel className="h-6 w-6" />,
}

const PRODUCT_ACCENT: Record<string, string> = {
  hoa: "text-blue-600 bg-blue-50",
  property: "text-emerald-600 bg-emerald-50",
  eviction: "text-rose-600 bg-rose-50",
}

export default function HomePage() {
  return (
    <>
      {/* HERO — multi-product Homeowner Hub */}
      <section className="gradient-mesh relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Homeowner Hub · multi-tenant SaaS · US-hosted
            </span>

            <h1 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              One hub for everything you own.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Three products, one account. Run your HOA, manage rentals, and
              drive eviction workflows — all from the {BRAND.name} platform.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[var(--tenant-primary)] px-8 text-base text-white hover:bg-[#1A3A5F]"
              >
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-300 px-8 text-base"
              >
                <Link href="#products">Explore the three products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PRODUCT CARDS */}
      <Section id="products" bordered>
        <SectionHeading
          eyebrow="The platform"
          title="Three products. One account."
          subtitle="Turn on only what you need. Modules can be added or removed any time from your workspace settings."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div
              key={p.slug}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${PRODUCT_ACCENT[p.slug]}`}
              >
                {PRODUCT_ICONS[p.slug]}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{p.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {p.description}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 flex-none text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex-1" />
              <Button asChild variant="outline" className="mt-2">
                <Link href={`/products/${p.slug}`}>
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* WHY ONE HUB */}
      <Section bordered muted>
        <SectionHeading
          eyebrow="Why one hub"
          title="Most homeowners stitch together five tools."
          subtitle="We built one workspace that scales from your first rental to a 200-door portfolio — with the legal-grade rigor that eviction demands."
        />
        <div className="mx-auto mt-12 grid max-w-3xl gap-3">
          {[
            "Single sign-on across HOA, property, and eviction modules.",
            "Per-jurisdiction eviction templates (state + county).",
            "Role-based access for owners, managers, board members, vendors.",
            "Cancel any module independently — no vendor lock-in.",
          ].map((line) => (
            <div
              key={line}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
              <span className="text-sm text-slate-700">{line}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section bordered>
        <SectionHeading
          eyebrow="Common questions"
          title="The first questions every homeowner asks."
        />
        <Faq items={FAQ_HOME} />
      </Section>
    </>
  )
}
