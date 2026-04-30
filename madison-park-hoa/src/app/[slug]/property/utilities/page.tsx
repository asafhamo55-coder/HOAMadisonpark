import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireTenantModule } from "@/lib/modules"

export default async function PmUtilitiesPage() {
  const ctx = await requireTenantModule("property")
  const { data: utilities } = await ctx.supabase
    .from("pm_utilities")
    .select("id, utility_type, provider, paid_by, monthly_estimate")
    .order("utility_type")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Utilities</h1>
      <Card>
        <CardHeader>
          <CardTitle>{utilities?.length ?? 0} utility accounts</CardTitle>
          <CardDescription>
            Track water, electric, gas, internet, and trash per property or unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!utilities || utilities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No utility accounts yet.</p>
          ) : (
            <ul className="divide-y">
              {utilities.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium capitalize">{u.utility_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.provider ?? "—"} · paid by {u.paid_by}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {u.monthly_estimate ? `$${Number(u.monthly_estimate).toFixed(0)}/mo` : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
