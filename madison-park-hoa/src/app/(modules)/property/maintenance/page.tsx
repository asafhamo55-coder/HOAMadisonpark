import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
}

export default async function MaintenancePage() {
  const ws = await requireWorkspaceWithModule("property")
  const supabase = createClient()
  const { data: requests } = await supabase
    .from("pm_maintenance_requests")
    .select("id, title, priority, status, reported_at")
    .eq("workspace_id", ws.id)
    .order("reported_at", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
      <Card>
        <CardHeader>
          <CardTitle>{requests?.length ?? 0} requests</CardTitle>
          <CardDescription>Track work orders from open to closed.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!requests || requests.length === 0) ? (
            <p className="text-sm text-muted-foreground">No maintenance requests yet.</p>
          ) : (
            <ul className="divide-y">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.reported_at).toLocaleDateString()} · {r.priority}
                    </div>
                  </div>
                  <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
