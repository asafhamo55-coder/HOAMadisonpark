import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewCaseForm } from "./new-case-form"

export default async function NewCasePage() {
  await requireWorkspaceWithModule("eviction")
  const supabase = createClient()
  const { data: jurisdictions } = await supabase
    .from("ev_jurisdictions")
    .select("id, display_name")
    .eq("active", true)
    .order("display_name")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New eviction case</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Case details</CardTitle>
          <CardDescription>
            We&apos;ll start the workflow at the first stage for the chosen jurisdiction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewCaseForm jurisdictions={jurisdictions ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
