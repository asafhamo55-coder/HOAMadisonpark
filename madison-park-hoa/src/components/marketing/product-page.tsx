import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Section, SectionHeading } from "@/components/marketing/section"

export function ProductPageShell({
  eyebrow,
  title,
  subtitle,
  features,
  faqs,
  ctaHref = "/signup",
  ctaLabel = "Start free trial",
}: {
  eyebrow: string
  title: string
  subtitle: string
  features: { title: string; description: string }[]
  faqs?: { q: string; a: string }[]
  ctaHref?: string
  ctaLabel?: string
}) {
  return (
    <>
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-lg text-slate-600">{subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
            >
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section bordered muted>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {f.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {faqs && faqs.length > 0 && (
        <Section bordered>
          <SectionHeading eyebrow="FAQ" title="Frequently asked" />
          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <p className="font-medium text-slate-900">{f.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
