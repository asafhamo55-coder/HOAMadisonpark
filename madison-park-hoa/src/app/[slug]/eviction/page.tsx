import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isOverdue } from "@/lib/eviction/workflow"
import { requireTenantModule } from "@/lib/modules"
import { tenantPath } from "@/lib/tenant-path"

export default async function EvictionDashboard() {
  const ctx = await requireTenantModule("eviction")
  const slug = ctx.tenantSlug

  const [{ count: openCount }, { count: filedCount }, { count: judgmentCount }, { data: cases }] =
    await Promise.all([
      ctx.supabase.from("ev_cases").select("id", { count: "exact", head: true }).eq("status", "open"),
      ctx.supabase.from("ev_cases").select("id", { count: "exact", head: true }).eq("status", "filed"),
      ctx.supabase.from("ev_cases").select("id", { count: "exact", head: true }).eq("status", "judgment"),
      ctx.supabase
        .from("ev_cases")
        .select("id, tenant_name, property_address, current_stage, stage_due_at, status")
        .not("status", "in", "(closed,dismissed,withdrawn)")
        .order("stage_due_at", { ascending: true })
        .limit(10),
    ])

  const overdue = (cases ?? []).filter((c) => isOverdue(c.stage_due_at))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eviction Hub</h1>
          <p className="text-sm text-muted-foreground">Stage-by-stage workflow per jurisdiction.</p>
        </div>
        <Button asChild>
          <Link href={tenantPath(slug, "eviction", "cases", "new")}>New case</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Open" value={openCount ?? 0} />
        <Stat label="Filed" value={filedCount ?? 0} />
        <Stat label="Judgment" value={judgmentCount ?? 0} />
        <Stat label="Overdue" value={overdue.length} accent="text-rose-600" />
      </div>

      {overdue.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Cases past their stage deadline
            </CardTitle>
            <CardDescription>Move these forward or document the delay.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {overdue.map((c) => (
                <li key={c.id}>
                  <Link className="underline" href={tenantPath(slug, "eviction", "cases", c.id)}>
                    {c.tenant_name ?? "Unknown tenant"} — {c.property_address ?? ""}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">stage: {c.current_stage}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active cases</CardTitle>
        </CardHeader>
        <CardContent>
          {!cases || cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active cases. Click <strong>New case</strong> to start one.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Tenant</th>
                  <th className="py-2">Address</th>
                  <th className="py-2">Stage</th>
                  <th className="py-2">Due</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2">
                      <Link className="underline" href={tenantPath(slug, "eviction", "cases", c.id)}>
                        {c.tenant_name ?? "—"}
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground">{c.property_address ?? "—"}</td>
                    <td className="py-2">{c.current_stage}</td>
                    <td className="py-2">
                      {c.stage_due_at ? new Date(c.stage_due_at).toLocaleDateString() : "—"}
                    </td>
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

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-3xl ${accent ?? ""}`}>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
