import Link from "next/link"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Contact | Eviction Management",
  description: "Sales, legal partnerships, and support — routed to the right team.",
}

const ROUTES = [
  {
    title: "Sales — landlords and property managers",
    body: "Pricing questions, demos, migrations from spreadsheets or other tools.",
    email: "sales@eviction.homeowner-hub.app",
  },
  {
    title: "Legal partnerships — attorneys and bar associations",
    body: "Jurisdiction expansion, co-marketing, CLE collaborations.",
    email: "partnerships@eviction.homeowner-hub.app",
  },
  {
    title: "Support — existing customers",
    body: "In-app chat preferred; email if you can't get to chat.",
    email: "support@eviction.homeowner-hub.app",
  },
]

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Back home</Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Tell us which conversation to have.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600">
          Different inboxes for different intents. Pick the one that fits the question.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ROUTES.map((r) => (
            <a
              key={r.email}
              href={`mailto:${r.email}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:border-rose-300"
            >
              <h3 className="text-base font-semibold text-slate-900">{r.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{r.body}</p>
              <span className="mt-4 font-mono text-xs text-rose-700 group-hover:underline">{r.email}</span>
            </a>
          ))}
        </div>

        <p className="mt-12 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>Disclaimer:</strong> Eviction Management is workflow software, not legal advice.
          Consult qualified counsel for your jurisdiction.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
