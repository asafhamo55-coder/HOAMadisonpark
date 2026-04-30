import { notFound } from "next/navigation"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { findStage, isOverdue, stageIndex, type WorkflowDefinition } from "@/lib/eviction/workflow"
import { CaseActions } from "./case-actions"

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const ws = await requireWorkspaceWithModule("eviction")
  const supabase = createClient()
  const { data: c } = await supabase
    .from("ev_cases")
    .select(`
      id, tenant_name, tenant_email, property_address, unit, rent_owed, reason,
      status, current_stage, stage_due_at, created_at, closed_at,
      jurisdiction:ev_jurisdictions(display_name),
      workflow:ev_workflow_definitions(id, definition)
    `)
    .eq("workspace_id", ws.id)
    .eq("id", params.id)
    .maybeSingle()

  if (!c) return notFound()

  const caseRow = c as typeof c & {
    jurisdiction: { display_name: string } | null
    workflow: { id: string; definition: WorkflowDefinition } | null
  }
  const def: WorkflowDefinition | null = caseRow.workflow?.definition ?? null
  const stages = def?.stages ?? []
  const currentIdx = def ? stageIndex(def, c.current_stage) : -1
  const cur = def ? findStage(def, c.current_stage) : null
  const nextStageKey = cur?.next ?? null

  const { data: events } = await supabase
    .from("ev_case_events")
    .select("id, event_type, from_stage, to_stage, notes, occurred_at")
    .eq("case_id", c.id)
    .order("occurred_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{c.tenant_name}</h1>
          <p className="text-sm text-muted-foreground">
            {c.property_address}{c.unit ? ` · Unit ${c.unit}` : ""} · {caseRow.jurisdiction?.display_name}
          </p>
        </div>
        <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs">{c.status}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            Current stage: <strong>{cur?.label ?? c.current_stage}</strong>
            {c.stage_due_at && (
              <>
                {" · "}due {new Date(c.stage_due_at).toLocaleDateString()}
                {isOverdue(c.stage_due_at) && (
                  <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700">overdue</span>
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {stages.map((s, i) => {
              const done = i < currentIdx
              const active = i === currentIdx
              return (
                <li key={s.key} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : active ? (
                      <Clock className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className={`font-medium ${active ? "" : "text-muted-foreground"}`}>{s.label}</div>
                    {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                    {s.deadline_days > 0 && (
                      <p className="text-xs text-muted-foreground">Deadline: {s.deadline_days} days</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      <CaseActions
        caseId={c.id}
        canAdvance={!!nextStageKey && !["closed", "dismissed", "withdrawn"].includes(c.status)}
        nextStageLabel={nextStageKey ? stages.find((s) => s.key === nextStageKey)?.label ?? null : null}
        canClose={!["closed", "dismissed", "withdrawn"].includes(c.status)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {(!events || events.length === 0) ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-muted pl-3">
                  <div className="font-medium">{e.event_type}{e.from_stage && e.to_stage ? `: ${e.from_stage} → ${e.to_stage}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleString()}</div>
                  {e.notes && <p className="mt-1 text-muted-foreground">{e.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
