import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LeasesPage() {
  const ws = await requireWorkspaceWithModule("property")
  const supabase = createClient()
  const { data: leases } = await supabase
    .from("pm_leases")
    .select("id, start_date, end_date, monthly_rent, status, unit_id, tenant_id")
    .eq("workspace_id", ws.id)
    .order("start_date", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Leases</h1>
      <Card>
        <CardHeader>
          <CardTitle>{leases?.length ?? 0} leases</CardTitle>
          <CardDescription>
            Active and historical leases. Create one by linking a tenant to a unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!leases || leases.length === 0) ? (
            <p className="text-sm text-muted-foreground">No leases yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {leases.map((l) => (
                <li key={l.id} className="flex justify-between border-b py-2 last:border-0">
                  <span>{l.start_date} → {l.end_date ?? "ongoing"}</span>
                  <span className="font-medium">${l.monthly_rent}/mo · {l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
