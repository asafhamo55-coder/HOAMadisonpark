import Link from "next/link"
import { ArrowLeft, Building, CheckCircle2, Sparkles } from "lucide-react"

const HOMEOWNER_HUB_URL =
  process.env.NEXT_PUBLIC_HOMEOWNER_HUB_URL ?? "https://homeowner-hub.app"

export default function HomePage() {
  return (
    <>
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href={HOMEOWNER_HUB_URL}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Homeowner Hub
          </a>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden="true" className="inline-block h-7 w-7 rounded-md bg-emerald-600" />
            Property Management
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-20 text-center sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" /> Coming soon
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Property Management is on the way.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Tenants, leases, rent collection, vendors, utilities, and maintenance —
            in one tool built for owners and operators. We&apos;re shipping the early
            access in Q3.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Join the waitlist
            </Link>
            <a
              href={HOMEOWNER_HUB_URL}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Other Homeowner Hub products
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {[
            { title: "Properties & units", body: "Single-family, multi-family, mixed-use — model them all." },
            { title: "Tenants & leases", body: "Rent roll, deposits, renewals, and lease docs in one place." },
            { title: "Rent collection", body: "Recurring charges, late fees, partial payments, statements." },
            { title: "Utilities", body: "Track meters and bills per unit; allocate to tenants." },
            { title: "Vendors", body: "Insurance certs, W-9s, and per-job tracking." },
            { title: "Maintenance", body: "Tenants submit requests; you assign, schedule, and close them." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span className="flex items-center gap-2">
            <Building className="h-4 w-4" /> Property Management — part of Homeowner Hub
          </span>
          <a href={HOMEOWNER_HUB_URL} className="hover:text-slate-900">homeowner-hub.app</a>
        </div>
      </footer>
    </>
  )
}
