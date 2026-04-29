import type { Metadata } from "next"
import { Mail, MessageCircle } from "lucide-react"

import { Section, SectionHeading } from "@/components/marketing/section"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${BRAND.name} team — sales, support, and partnership questions.`,
  alternates: { canonical: `${BRAND.url}/contact` },
}

export default function ContactPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Contact"
          title="We read every email."
          subtitle="We're a small team — fast replies, no chatbots. Pick the address that fits your question and we'll route it from there."
        />

        <div className="mx-auto mt-14 grid max-w-3xl gap-5 md:grid-cols-2">
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Sales & general
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Questions about plans, demos, or whether {BRAND.name} fits your
              community.
            </p>
            <span className="mt-4 text-sm font-medium text-emerald-700 group-hover:underline">
              {BRAND.supportEmail}
            </span>
          </a>

          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Existing customers
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Already a tenant? Sign in and use the support widget — your
              question gets routed with full context.
            </p>
            <span className="mt-4 text-sm font-medium text-emerald-700 group-hover:underline">
              {BRAND.supportEmail}
            </span>
          </a>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Mailing address available on request via the email above.
        </p>
      </Section>
    </>
  )
}
