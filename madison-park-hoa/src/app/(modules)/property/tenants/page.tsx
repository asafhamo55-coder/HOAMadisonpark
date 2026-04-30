import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TenantsPage() {
  const ws = await requireWorkspaceWithModule("property")
  const supabase = createClient()
  const { data: tenants } = await supabase
    .from("pm_tenants")
    .select("id, full_name, email, phone, created_at")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
      {(!tenants || tenants.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>No tenants yet</CardTitle>
            <CardDescription>
              Tenants will appear here as you add them or create leases. (Tenant
              creation form is coming online — for now, add via Supabase.)
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{t.full_name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.email ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
