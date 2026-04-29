import type { Metadata } from "next"

import { PricingGrid } from "@/components/marketing/pricing-grid"
import { Faq } from "@/components/marketing/faq"
import { Section, SectionHeading } from "@/components/marketing/section"
import { ADDONS, BRAND, FAQ_BILLING } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent monthly or annual pricing for HOA Pro Hub. Starter $49, Standard $129, Pro $299. 14-day free trial, no credit card.",
  alternates: { canonical: `${BRAND.url}/pricing` },
  openGraph: {
    title: `Pricing — ${BRAND.name}`,
    description: `Starter $49, Standard $129, Pro $299. Annual saves 17%.`,
    url: `${BRAND.url}/pricing`,
    type: "website",
  },
}

export default function PricingPage() {
  return (
    <>
      <Section className="!pb-12">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing for community boards."
          subtitle="Start free for 14 days. Move to a paid plan only when you're ready. No contracts, no per-resident fees, no surprises."
        />
      </Section>

      <Section className="!pt-0">
        <PricingGrid />
      </Section>

      <Section bordered muted>
        <SectionHeading
          eyebrow="Add-ons"
          title="Optional extras when you need them."
          subtitle="None of these are required. Most communities never buy any."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((a) => (
            <div
              key={a.name}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {a.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-emerald-700">
                {a.price}
              </p>
              <p className="mt-3 text-sm text-slate-600">{a.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bordered>
        <SectionHeading
          eyebrow="Billing FAQ"
          title="The questions every treasurer asks first."
        />
        <Faq items={FAQ_BILLING} />
      </Section>
    </>
  )
}
