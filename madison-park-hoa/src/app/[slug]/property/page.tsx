import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireTenantModule } from "@/lib/modules"
import { tenantPath } from "@/lib/tenant-path"

export default async function PropertyDashboard() {
  const ctx = await requireTenantModule("property")
  const slug = ctx.tenantSlug

  const [{ count: propsCount }, { count: tenantsCount }, { count: leasesCount }, { count: openMaint }] =
    await Promise.all([
      ctx.supabase.from("pm_properties").select("id", { count: "exact", head: true }),
      ctx.supabase.from("pm_tenants").select("id", { count: "exact", head: true }),
      ctx.supabase.from("pm_leases").select("id", { count: "exact", head: true }).eq("status", "active"),
      ctx.supabase.from("pm_maintenance_requests").select("id", { count: "exact", head: true }).in("status", ["open", "assigned", "scheduled", "in_progress"]),
    ])

  const stats = [
    { label: "Properties", value: propsCount ?? 0, href: tenantPath(slug, "property", "properties") },
    { label: "Tenants", value: tenantsCount ?? 0, href: tenantPath(slug, "property", "tenants") },
    { label: "Active leases", value: leasesCount ?? 0, href: tenantPath(slug, "property", "leases") },
    { label: "Open maintenance", value: openMaint ?? 0, href: tenantPath(slug, "property", "maintenance") },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Property Management</h1>
          <p className="text-sm text-muted-foreground">Tenants, leases, rent, and maintenance.</p>
        </div>
        <Button asChild>
          <Link href={tenantPath(slug, "property", "properties")}>Add property</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:bg-muted/30">
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
          <CardDescription>Set up your portfolio in five steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="ml-5 list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Add a <Link className="underline" href={tenantPath(slug, "property", "properties")}>property</Link> and its units.</li>
            <li>Add <Link className="underline" href={tenantPath(slug, "property", "tenants")}>tenants</Link>.</li>
            <li>Create <Link className="underline" href={tenantPath(slug, "property", "leases")}>leases</Link> linking tenants to units.</li>
            <li>Record <Link className="underline" href={tenantPath(slug, "property", "payments")}>payments</Link> as rent comes in.</li>
            <li>Set up <Link className="underline" href={tenantPath(slug, "property", "vendors")}>vendors</Link> and watch <Link className="underline" href={tenantPath(slug, "property", "maintenance")}>maintenance requests</Link>.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
