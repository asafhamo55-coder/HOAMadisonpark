import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PaymentsPage() {
  const ws = await requireWorkspaceWithModule("property")
  const supabase = createClient()
  const { data: payments } = await supabase
    .from("pm_payments")
    .select("id, amount, paid_on, method, category, lease_id")
    .eq("workspace_id", ws.id)
    .order("paid_on", { ascending: false })
    .limit(100)

  const total = (payments ?? []).reduce(
    (acc, p) => acc + Number(p.amount ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      <Card>
        <CardHeader>
          <CardDescription>Last 100 payments</CardDescription>
          <CardTitle>${total.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!payments || payments.length === 0) ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2">{p.paid_on}</td>
                    <td className="py-2 font-medium">${Number(p.amount).toFixed(2)}</td>
                    <td className="py-2">{p.category}</td>
                    <td className="py-2">{p.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
