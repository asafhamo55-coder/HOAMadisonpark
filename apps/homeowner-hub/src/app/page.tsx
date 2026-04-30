import Link from "next/link"
import { ArrowRight, Building, Building2, Gavel, ShieldCheck } from "lucide-react"

const PRODUCTS = [
  {
    slug: "hoa",
    name: "HOA Management Hub",
    tagline: "Run your homeowners association.",
    description:
      "Properties, residents, violations, letters, payments, leasing, and a resident portal. Built for HOAs, condos, and master-planned communities.",
    href: process.env.NEXT_PUBLIC_HOA_URL ?? "https://hoa.homeowner-hub.app",
    icon: Building2,
    accent: "bg-blue-50 text-blue-600",
    cta: "Open HOA Hub",
  },
  {
    slug: "property",
    name: "Property Management",
    tagline: "Tenants, leases, rent, maintenance.",
    description:
      "Manage every property you own or operate: units, tenants, leases, rent collection, vendors, utilities, and maintenance.",
    href: process.env.NEXT_PUBLIC_PROPERTY_URL ?? "https://property.homeowner-hub.app",
    icon: Building,
    accent: "bg-emerald-50 text-emerald-600",
    cta: "Open Property Hub",
  },
  {
    slug: "eviction",
    name: "Eviction Management",
    tagline: "Stage-by-stage workflow per jurisdiction.",
    description:
      "Eviction is hyperlocal. Stages, deadlines, and notices modeled per state and county — starting with Georgia (Rockdale + DeKalb).",
    href: process.env.NEXT_PUBLIC_EVICTION_URL ?? "https://eviction.homeowner-hub.app",
    icon: Gavel,
    accent: "bg-rose-50 text-rose-600",
    cta: "Open Eviction Hub",
  },
] as const

export default function HomePage() {
  return (
    <>
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden="true" className="inline-block h-7 w-7 rounded-md bg-[var(--primary)]" />
            Homeowner Hub
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#products" className="hover:text-slate-900">Products</a>
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" /> Three products. One brand. Zero lock-in.
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            One hub for everything you own.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Homeowner Hub is the umbrella for three independent SaaS products built
            for homeowners and property managers. Each is purpose-built, separately
            priced, and runs standalone — pick one, pick all three.
          </p>
          <div className="mt-10 flex justify-center">
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Explore the three products <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* PRODUCT CARDS */}
      <section id="products" className="border-t border-slate-200 bg-slate-50/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              The platform
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Three products. Pick what you need.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              They&apos;re built independently. Each has its own marketing site, signup,
              login, and database. No shared accounts, no forced bundles.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PRODUCTS.map((p) => {
              const Icon = p.icon
              return (
                <a
                  key={p.slug}
                  href={p.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${p.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{p.name}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{p.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.description}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 group-hover:gap-2.5">
                    {p.cta} <ArrowRight className="h-4 w-4 transition-all" />
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* WHY UMBRELLA */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Why three products instead of one bloated suite?
          </h2>
          <ul className="mt-10 space-y-4 text-base text-slate-700">
            {[
              "Each product is purpose-built. HOA boards, property managers, and eviction attorneys have different workflows and data.",
              "Buy what you need. No 'platform fee' for features you'll never use.",
              "Independent uptime. A bug in Eviction doesn't take down your HOA's payment portal.",
              "Bring your own data. No forced cross-product reporting; export from each independently.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Homeowner Hub. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
