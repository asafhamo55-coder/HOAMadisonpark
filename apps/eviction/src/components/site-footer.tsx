import Link from "next/link"

const HOMEOWNER_HUB_URL =
  process.env.NEXT_PUBLIC_HOMEOWNER_HUB_URL ?? "https://homeowner-hub.app"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
          <strong>Disclaimer:</strong> Eviction Management is workflow software, not legal advice.
          Consult qualified counsel for your jurisdiction.
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block h-6 w-6 rounded-md bg-rose-600" /> Eviction Management
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Per-jurisdiction eviction workflow with computed deadlines, generated documents, and a defensible audit trail.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { href: "/jurisdictions", label: "Jurisdictions" },
              { href: "/pricing", label: "Pricing" },
              { href: "/contact", label: "Demo" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: "/contact", label: "Contact" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { href: "/legal/disclaimer", label: "Disclaimer" },
              { href: "/legal/terms", label: "Terms" },
              { href: "/legal/privacy", label: "Privacy" },
            ]}
          />
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Eviction Management. Part of the Homeowner Hub family.</span>
          <a href={HOMEOWNER_HUB_URL} className="hover:text-slate-900">homeowner-hub.app</a>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-slate-600 hover:text-slate-900">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
