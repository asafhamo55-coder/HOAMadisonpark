import Link from "next/link"

export const metadata = { title: "About — Homeowner Hub" }

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back</Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">About Homeowner Hub</h1>
      <p className="mt-6 text-lg text-slate-700">
        Homeowner Hub is the umbrella brand for three independent SaaS products
        built for the people who actually run residential property: HOA boards,
        landlords, and eviction practitioners.
      </p>
      <p className="mt-4 text-lg text-slate-700">
        Each product is its own company-grade SaaS. They share a brand and a
        philosophy — purpose-built tools, transparent pricing, exportable data —
        but no code, database, or login.
      </p>
      <h2 className="mt-12 text-2xl font-semibold">Why we ship three products instead of one</h2>
      <ul className="mt-4 list-disc pl-6 text-base text-slate-700">
        <li className="mt-2">An HOA board doesn&apos;t want a rental rent-roll bolted into their dashboard.</li>
        <li className="mt-2">A landlord doesn&apos;t want HOA-specific concepts like CC&amp;Rs and ARC committees.</li>
        <li className="mt-2">An eviction practitioner needs a tightly-scoped workflow tool with state-specific playbooks, not a kitchen-sink app.</li>
      </ul>
    </main>
  )
}
