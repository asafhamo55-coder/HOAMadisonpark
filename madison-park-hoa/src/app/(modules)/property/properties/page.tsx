import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddPropertyButton } from "./add-property-button"

export default async function PropertiesPage() {
  const ws = await requireWorkspaceWithModule("property")
  const supabase = createClient()
  const { data: properties } = await supabase
    .from("pm_properties")
    .select("id, name, address, city, state, property_type, created_at")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
        <AddPropertyButton />
      </div>

      {(!properties || properties.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>No properties yet</CardTitle>
            <CardDescription>
              Add your first property to start tracking units, leases, and rent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPropertyButton />
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
