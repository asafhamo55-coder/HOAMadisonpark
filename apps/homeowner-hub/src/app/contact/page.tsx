import Link from "next/link"
import type { Metadata } from "next"
import { Building, Building2, Gavel } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Contact — Homeowner Hub",
  description:
    "Contact the right team for HOA Management Hub, Property Management, or Eviction Management — plus the brand and partnerships inbox for the umbrella.",
}

const PRODUCTS = [
  {
    name: "HOA Management Hub",
    icon: Building2,
    accent: "bg-blue-50 text-blue-600",
    audience: "For HOA boards, community managers, and residents.",
    email: "hello@hoa.homeowner-hub.app",
    href: process.env.NEXT_PUBLIC_HOA_URL ?? "https://hoa.homeowner-hub.app",
  },
  {
    name: "Property Management",
    icon: Building,
    accent: "bg-emerald-50 text-emerald-600",
    audience: "For landlords and small property managers.",
    email: "hello@property.homeowner-hub.app",
    href: process.env.NEXT_PUBLIC_PROPERTY_URL ?? "https://property.homeowner-hub.app",
  },
  {
    name: "Eviction Management",
    icon: Gavel,
    accent: "bg-rose-50 text-rose-600",
    audience: "For attorneys, paralegals, and landlords filing a case.",
    email: "hello@eviction.homeowner-hub.app",
    href: process.env.NEXT_PUBLIC_EVICTION_URL ?? "https://eviction.homeowner-hub.app",
  },
]

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back home</Link>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Talk to the right team the first time.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Each of the three products handles its own sales, support, and onboarding.
          The umbrella forwards — it doesn&apos;t intercept. Pick the inbox that matches the job.
        </p>

        {/* PRODUCT INBOXES */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PRODUCTS.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${p.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{p.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{p.audience}</p>
                <div className="mt-4 flex flex-1 flex-col justify-end gap-2 text-sm">
                  <a className="font-mono text-emerald-700 hover:underline" href={`mailto:${p.email}`}>
                    {p.email}
                  </a>
                  <span className="text-xs text-slate-500">Response within one business day</span>
                  <a className="text-xs text-slate-600 underline-offset-2 hover:underline" href={`${p.href}/contact`}>
                    Product contact page →
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        {/* BRAND/PARTNERSHIPS */}
        <section className="mt-16 rounded-2xl border border-slate-200 bg-slate-50/60 p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Brand, press, and partnerships
          </h2>
          <p className="mt-3 max-w-2xl text-base text-slate-700">
            For anything that&apos;s about the umbrella itself — press, partnership inquiries,
            integration conversations, brand misuse, or you just want to say hello to the team —
            write to us directly.
          </p>
          <p className="mt-4 text-base">
            Email:{" "}
            <a className="font-mono text-emerald-700 hover:underline" href="mailto:hello@homeowner-hub.app">
              hello@homeowner-hub.app
            </a>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            We read everything. Most replies within two business days. For urgent
            product-specific issues, the inboxes above are faster.
          </p>
        </section>

        {/* WHAT NOT */}
        <section className="mt-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            What this inbox isn&apos;t for
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
            <li>• Account or billing help for one of the three products → use the product&apos;s own contact page.</li>
            <li>• Live support during an outage → each product has its own status page linked from its footer.</li>
            <li>• Sales calls about features inside a specific product → the product team will be a much better conversation.</li>
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
