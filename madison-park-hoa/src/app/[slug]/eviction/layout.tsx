import Link from "next/link"
import { ArrowLeftRight, Files, LayoutDashboard, Map } from "lucide-react"

import { requireTenantModule } from "@/lib/modules"
import { tenantPath } from "@/lib/tenant-path"

export const dynamic = "force-dynamic"

export default async function EvictionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const ctx = await requireTenantModule("eviction")
  const slug = ctx.tenantSlug

  const nav = [
    { href: tenantPath(slug, "eviction"), label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: tenantPath(slug, "eviction", "cases"), label: "Cases", icon: <Files className="h-4 w-4" /> },
    { href: tenantPath(slug, "eviction", "jurisdictions"), label: "Jurisdictions", icon: <Map className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href={tenantPath(slug)} className="font-semibold text-slate-900">
              {params.slug}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Eviction Hub</span>
          </div>
          <Link
            href={tenantPath(slug)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftRight className="h-3 w-3" /> Switch module
          </Link>
        </div>
      </header>
      <div className="container grid gap-6 py-6 md:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {n.icon}
              {n.label}
            </Link>
          ))}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}
