import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"

export default async function CasesPage() {
  const ws = await requireWorkspaceWithModule("eviction")
  const supabase = createClient()
  const { data: cases } = await supabase
    .from("ev_cases")
    .select("id, tenant_name, property_address, current_stage, stage_due_at, status, created_at")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
        <Button asChild>
          <Link href="/eviction/cases/new">New case</Link>
        </Button>
      </div>

      {(!cases || cases.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>No cases yet</CardTitle>
            <CardDescription>Open your first case to begin a workflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/eviction/cases/new">New case</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">
                    <Link className="underline" href={`/eviction/cases/${c.id}`}>
                      {c.tenant_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{c.property_address ?? "—"}</td>
                  <td className="px-4 py-2">{c.current_stage}</td>
                  <td className="px-4 py-2">{c.stage_due_at ? new Date(c.stage_due_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2"><span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
