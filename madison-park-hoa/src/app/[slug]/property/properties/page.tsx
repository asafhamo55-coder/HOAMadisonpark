import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireTenantModule } from "@/lib/modules"
import { AddPmPropertyButton } from "./add-property-button"

export default async function PmPropertiesPage() {
  const ctx = await requireTenantModule("property")
  const { data: properties } = await ctx.supabase
    .from("pm_properties")
    .select("id, name, address, city, state, property_type, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
        <AddPmPropertyButton />
      </div>

      {!properties || properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No properties yet</CardTitle>
            <CardDescription>
              Add your first property to start tracking units, leases, and rent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPmPropertyButton />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription>{p.address}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div>{[p.city, p.state].filter(Boolean).join(", ")}</div>
                <div className="mt-2 inline-block rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
                  {p.property_type.replace("_", " ")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
