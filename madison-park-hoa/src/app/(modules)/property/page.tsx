import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"

export default async function PropertyDashboard() {
  const ws = await requireWorkspaceWithModule("property")
  const supabase = createClient()

  const [{ count: propsCount }, { count: tenantsCount }, { count: leasesCount }, { count: openMaint }] =
    await Promise.all([
      supabase.from("pm_properties").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
      supabase.from("pm_tenants").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
      supabase.from("pm_leases").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id).eq("status", "active"),
      supabase.from("pm_maintenance_requests").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id).in("status", ["open", "assigned", "scheduled", "in_progress"]),
    ])

  const stats = [
    { label: "Properties", value: propsCount ?? 0, href: "/property/properties" },
    { label: "Tenants", value: tenantsCount ?? 0, href: "/property/tenants" },
    { label: "Active leases", value: leasesCount ?? 0, href: "/property/leases" },
    { label: "Open maintenance", value: openMaint ?? 0, href: "/property/maintenance" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Property Management</h1>
          <p className="text-sm text-muted-foreground">Workspace: {ws.name}</p>
        </div>
        <Button asChild>
          <Link href="/property/properties">Add property</Link>
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
            <li>Add your <Link className="underline" href="/property/properties">properties</Link> and units.</li>
            <li>Add <Link className="underline" href="/property/tenants">tenants</Link>.</li>
            <li>Create <Link className="underline" href="/property/leases">leases</Link> linking tenants to units.</li>
            <li>Record <Link className="underline" href="/property/payments">payments</Link> as rent comes in.</li>
            <li>Set up <Link className="underline" href="/property/vendors">vendors</Link> and watch <Link className="underline" href="/property/maintenance">maintenance requests</Link>.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
