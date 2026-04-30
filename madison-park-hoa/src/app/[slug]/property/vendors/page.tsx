import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireTenantModule } from "@/lib/modules"

export default async function PmVendorsPage() {
  const ctx = await requireTenantModule("property")
  const { data: vendors } = await ctx.supabase
    .from("pm_vendors")
    .select("id, name, category, contact_name, phone, insurance_expiry")
    .order("name")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
      <Card>
        <CardHeader>
          <CardTitle>{vendors?.length ?? 0} vendors</CardTitle>
          <CardDescription>Plumbers, electricians, landscapers, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          {!vendors || vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Contact</th>
                  <th className="py-2">Insurance</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="py-2 font-medium">{v.name}</td>
                    <td className="py-2 text-muted-foreground">{v.category ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {v.contact_name ?? "—"} {v.phone ? `· ${v.phone}` : ""}
                    </td>
                    <td className="py-2 text-muted-foreground">{v.insurance_expiry ?? "—"}</td>
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
