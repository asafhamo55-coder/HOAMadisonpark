import Link from "next/link"

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="font-semibold">Homeowner Hub</div>
          <p className="mt-2 text-sm text-muted-foreground">
            One platform for HOAs, property managers, and eviction workflows.
          </p>
        </div>
        <FooterCol
          title="Products"
          links={[
            { href: "/products/hoa", label: "HOA Hub" },
            { href: "/products/property", label: "Property Management" },
            { href: "/products/eviction", label: "Eviction Hub" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: "/about", label: "About" },
            { href: "/pricing", label: "Pricing" },
            { href: "/contact", label: "Contact" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "/legal/terms", label: "Terms" },
            { href: "/legal/privacy", label: "Privacy" },
          ]}
        />
      </div>
      <div className="border-t">
        <div className="container flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Homeowner Hub. All rights reserved.</span>
          <span>Made for homeowners.</span>
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
      <div className="text-sm font-medium">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
