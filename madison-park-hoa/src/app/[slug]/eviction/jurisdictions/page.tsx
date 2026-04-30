import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireTenantModule } from "@/lib/modules"
import type { WorkflowDefinition } from "@/lib/eviction/workflow"

export default async function EvictionJurisdictionsPage() {
  const ctx = await requireTenantModule("eviction")
  const { data: jurisdictions } = await ctx.supabase
    .from("ev_jurisdictions")
    .select("id, state_code, county, display_name, ev_workflow_definitions(id, name, version, definition)")
    .order("state_code")
    .order("county")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jurisdictions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each jurisdiction ships with a workflow template (state + county-specific stages and deadlines).
          More are added by request.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {((jurisdictions ?? []) as Array<{
          id: string
          state_code: string
          county: string
          display_name: string
          ev_workflow_definitions: Array<{ definition: WorkflowDefinition }>
        }>).map((j) => {
          const def: WorkflowDefinition | null = j.ev_workflow_definitions?.[0]?.definition ?? null
          return (
            <Card key={j.id}>
              <CardHeader>
                <CardTitle>{j.display_name}</CardTitle>
                <CardDescription>
                  {j.state_code} · {j.county}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {def ? (
                  <ol className="ml-5 list-decimal space-y-1 text-sm">
                    {def.stages.map((s) => (
                      <li key={s.key}>
                        <span className="font-medium">{s.label}</span>
                        {s.deadline_days > 0 && (
                          <span className="text-muted-foreground"> · {s.deadline_days}d</span>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No workflow defined.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
