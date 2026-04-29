import type { Metadata } from "next"
import Link from "next/link"

import { Section, SectionHeading } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "About",
  description: `${BRAND.name} is built by board members and HOA admins who got tired of running their community in spreadsheets.`,
  alternates: { canonical: `${BRAND.url}/about` },
}

const VALUES = [
  {
    title: "Boards-first",
    body: "Every screen is designed around the volunteer hour. If a workflow takes more than three clicks for a board member, we redesign it.",
  },
  {
    title: "Resident-respectful",
    body: "Resident self-service isn't an upsell — it's the entire point. Boards spend less time on email; residents get answers without calling.",
  },
  {
    title: "Real audit trail",
    body: "Every change to a property, fine, or document is captured. When the next board takes over, history is right there.",
  },
  {
    title: "Your data, exportable",
    body: "We don't lock you in. CSV/PDF export is a first-class feature on every plan, including the trial.",
  },
]

export default function AboutPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="About"
          title={`${BRAND.name} is run-the-community software, built by people who run a community.`}
          subtitle="We started this because the tools we wanted didn't exist. Madison Park HOA was the first community on the platform — yours might be the next."
        />
      </Section>

      <Section bordered muted>
        <SectionHeading
          eyebrow="What we believe"
          title="The principles every release ships with."
          align="left"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section bordered>
        <SectionHeading
          eyebrow="Where we are"
          title="Pre-launch — and that's the right time to come on board."
          subtitle="We're inviting communities into the early-access pilot. Pricing is locked at launch rates for pilot tenants for as long as you stay."
        />
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
          >
            <Link href="/signup">Start free trial</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
