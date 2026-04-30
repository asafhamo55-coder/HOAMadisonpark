import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description: "Why Homeowner Hub exists.",
}

export default function AboutPage() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">About Homeowner Hub</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Homeowner Hub started as an HOA management platform for a Georgia
          community. As we kept hearing from owners managing rentals on the
          side, and from operators dragged into eviction proceedings without a
          playbook, the scope grew: we&apos;re building one workspace for
          everything you own.
        </p>
        <h2 className="mt-12 text-2xl font-semibold">Our principles</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li>• <span className="font-medium text-foreground">Modules, not bloat.</span> Turn on only what you need.</li>
          <li>• <span className="font-medium text-foreground">Local rules matter.</span> Eviction is per-county, not per-country.</li>
          <li>• <span className="font-medium text-foreground">Audit trail by default.</span> Every step is logged.</li>
          <li>• <span className="font-medium text-foreground">Owner-first.</span> The person who pays the mortgage is who we serve.</li>
        </ul>
      </div>
    </section>
  )
}
