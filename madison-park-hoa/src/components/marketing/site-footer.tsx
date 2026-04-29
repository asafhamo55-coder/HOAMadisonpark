import Link from "next/link"

import { BRAND, FOOTER_LINKS } from "@/lib/brand"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900"
            >
              <span
                aria-hidden="true"
                className="inline-block h-7 w-7 rounded-md"
                style={{ backgroundColor: "var(--tenant-primary)" }}
              />
              {BRAND.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-600">
              The operating system for residential communities.
            </p>
          </div>

          <FooterColumn title="Product" links={FOOTER_LINKS.product} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p>
            Made for boards, by people who&apos;ve sat on them.{" "}
            <a
              className="font-medium text-slate-700 hover:text-slate-900"
              href={`mailto:${BRAND.supportEmail}`}
            >
              {BRAND.supportEmail}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: ReadonlyArray<{ href: string; label: string }>
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
