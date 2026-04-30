import Link from "next/link"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "About — Property Management | Homeowner Hub",
  description:
    "Property Management is part of the Homeowner Hub family. Software built for landlords and property managers, not enterprise buyers.",
}

const BELIEFS = [
  "Software should disappear into your week, not become it.",
  "Tenants are customers. The portal should feel like one.",
  "Vendors are partners. Treat their paperwork like it matters.",
  "Pricing should be honest. No 'contact us' until 25 doors.",
  "Migration should be a feature, not a project.",
]

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back home</Link>

        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          We built this because the existing tools were built for someone else.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Property Management is one of three products in the Homeowner Hub family.
          We make software for the people who actually own and manage residential
          rentals — not the enterprises that consult to them.
        </p>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">The thesis</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Most rental software was designed for 500-door property managers and then
            watered down for everyone else. We started at the small end — the landlord
            with a day job — and scaled up. The result is a product that doesn&apos;t feel
            like a CRM.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">The Homeowner Hub family</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Three independent products: <strong>Property Management</strong> (this one),
            <strong> HOA Management Hub</strong>, and <strong>Eviction Management</strong>.
            Each runs on its own subdomain with its own account. Why? Because the buyer
            is different for each, and we&apos;d rather build three sharp tools than one
            bloated platform.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">What we believe</h2>
          <ul className="mt-6 space-y-3">
            {BELIEFS.map((b) => (
              <li key={b} className="rounded-xl border border-slate-200 bg-white p-4 text-base text-slate-700">
                {b}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <p className="text-base font-medium text-slate-900">Ready to try it?</p>
          <Link
            href="/signup"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Start free for 14 days →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
