import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import { Section, SectionHeading } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { BRAND, FEATURE_AREAS, type FeatureSlug } from "@/lib/brand"

export const dynamic = "force-static"

const VALID_SLUGS: FeatureSlug[] = [
  "properties",
  "violations",
  "letters",
  "payments",
  "portal",
  "documents",
]

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const feat = FEATURE_AREAS.find((f) => f.slug === params.slug)
  if (!feat) {
    return { title: "Feature not found" }
  }
  return {
    title: feat.title,
    description: feat.short,
    alternates: { canonical: `${BRAND.url}/features/${feat.slug}` },
    openGraph: {
      title: `${feat.title} — ${BRAND.name}`,
      description: feat.short,
      url: `${BRAND.url}/features/${feat.slug}`,
      type: "website",
    },
  }
}

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const feat = FEATURE_AREAS.find((f) => f.slug === params.slug)
  if (!feat) notFound()

  const idx = FEATURE_AREAS.findIndex((f) => f.slug === feat.slug)
  const prev = FEATURE_AREAS[(idx - 1 + FEATURE_AREAS.length) % FEATURE_AREAS.length]
  const next = FEATURE_AREAS[(idx + 1) % FEATURE_AREAS.length]

  return (
    <>
      <Section className="!pb-10">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to features
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Feature deep-dive
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {feat.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {feat.long}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
            >
              <Link href="/signup">Start free 14-day trial</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/demo">See it in the demo</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section bordered muted>
        <SectionHeading
          eyebrow="What you get"
          title={`Everything in ${feat.title.toLowerCase()}`}
          align="left"
        />
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {feat.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Check
                className="mt-1 h-4 w-4 flex-none text-emerald-600"
                aria-hidden="true"
              />
              <span className="text-sm text-slate-700">{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section bordered>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="font-display text-2xl font-medium tracking-tight text-slate-900">
            See it tied into the rest of {BRAND.name}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
            Every module shares the same property records, residents, and audit
            log. No reentry, no integrations to maintain.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/features/${prev.slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {prev.title}
              </Link>
            </Button>
            <Button
              asChild
              className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
            >
              <Link href={`/features/${next.slug}`}>
                {next.title}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
