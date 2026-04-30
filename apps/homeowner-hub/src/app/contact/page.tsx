import Link from "next/link"

export const metadata = { title: "Contact — Homeowner Hub" }

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back</Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-6 text-lg text-slate-700">
        Each product handles its own sales and support. Pick the one you&apos;re
        interested in:
      </p>
      <div className="mt-8 grid gap-4">
        <a
          href={process.env.NEXT_PUBLIC_HOA_URL ?? "https://hoa.homeowner-hub.app/contact"}
          className="rounded-xl border border-slate-200 bg-white p-5 hover:bg-slate-50"
        >
          <div className="font-semibold">HOA Management Hub</div>
          <div className="mt-1 text-sm text-slate-600">Community management for HOAs and condos.</div>
        </a>
        <a
          href={process.env.NEXT_PUBLIC_PROPERTY_URL ?? "https://property.homeowner-hub.app/contact"}
          className="rounded-xl border border-slate-200 bg-white p-5 hover:bg-slate-50"
        >
          <div className="font-semibold">Property Management</div>
          <div className="mt-1 text-sm text-slate-600">Rentals, tenants, leases, maintenance.</div>
        </a>
        <a
          href={process.env.NEXT_PUBLIC_EVICTION_URL ?? "https://eviction.homeowner-hub.app/contact"}
          className="rounded-xl border border-slate-200 bg-white p-5 hover:bg-slate-50"
        >
          <div className="font-semibold">Eviction Management</div>
          <div className="mt-1 text-sm text-slate-600">Per-jurisdiction eviction workflows.</div>
        </a>
      </div>
      <p className="mt-10 text-sm text-slate-500">
        Brand questions or partnerships: <a className="underline" href="mailto:hello@homeowner-hub.app">hello@homeowner-hub.app</a>
      </p>
    </main>
  )
}
