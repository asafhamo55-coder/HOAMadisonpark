import Link from "next/link"
import { Building2 } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon?: React.ReactNode
}

export function ModuleShell({
  moduleName,
  workspaceName,
  nav,
  children,
}: {
  moduleName: string
  workspaceName: string
  nav: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub" className="flex items-center gap-2 font-semibold">
              <Building2 className="h-5 w-5" />
              <span>Homeowner Hub</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{moduleName}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {workspaceName} ·{" "}
            <Link className="underline" href="/hub">
              switch
            </Link>
          </div>
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
