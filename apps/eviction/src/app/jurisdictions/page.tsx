import Link from "next/link"
import { CheckCircle2, Clock, MapPin } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Supported jurisdictions | Eviction Management",
  description:
    "Live in Georgia (Rockdale, DeKalb). See coverage, request a jurisdiction, and read our playbook methodology.",
}

const LIVE = [
  {
    state: "Georgia",
    county: "Rockdale County",
    court: "Magistrate Court of Rockdale County, Conyers",
    note: "Full dispossessory playbook. Live.",
  },
  {
    state: "Georgia",
    county: "DeKalb County (Decatur)",
    court: "Magistrate Court of DeKalb County",
    note: "Full dispossessory playbook. Live.",
  },
]

const UPCOMING = [
  { state: "Georgia", county: "Fulton County" },
  { state: "Georgia", county: "Gwinnett County" },
  { state: "Georgia", county: "Cobb County" },
]

export default function JurisdictionsPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-gradient-to-b from-slate-50 via-white to-white py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Coverage</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Where Eviction Management is live.
            </h1>
            <p className="mt-4 text-base text-slate-600">
              We launch jurisdictions only after a practicing attorney has reviewed the
              playbook against current statute and local court practice.
            </p>
          </div>
        </section>

        {/* LIVE */}
        <section className="bg-white pb-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Currently supported</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {LIVE.map((j) => (
                <div key={j.county} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Live
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {j.state} — {j.county}
                  </h3>
                  <p className="mt-1 text-sm italic text-slate-600">{j.court}</p>
                  <p className="mt-3 text-sm text-slate-700">{j.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* UPCOMING */}
        <section className="border-t border-slate-200 bg-slate-50/40 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Under review</h2>
            <p className="mt-1 text-sm text-slate-600">
              Drafting and attorney review in progress. Want yours prioritized?
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {UPCOMING.map((u) => (
                <div key={u.county} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{u.state}</div>
                    <div className="text-xs text-slate-600">{u.county}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/contact?topic=jurisdiction"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" /> Request a jurisdiction
            </Link>
          </div>
        </section>

        {/* METHODOLOGY */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              How we decide a playbook is ready
            </h2>
            <ol className="mt-6 list-decimal space-y-3 pl-5 text-base text-slate-700">
              <li>Statute mapped from primary sources.</li>
              <li>Local rules and standing orders reviewed.</li>
              <li>A practicing attorney admitted in the jurisdiction signs off.</li>
              <li>A versioned change log is published.</li>
            </ol>
            <p className="mt-6 rounded-md border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
              <strong>Disclaimer:</strong> Coverage of a jurisdiction does not warrant fitness for any particular case.
              Statutes change, local rules change, and individual judges issue standing orders. You are responsible
              for confirming every deadline and form against the law currently in effect in your jurisdiction.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
