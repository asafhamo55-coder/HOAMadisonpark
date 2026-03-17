import { getCurrentUser } from "@/lib/auth"
import { getPropertiesWithSummary } from "./page-data"
import { PropertiesGrid } from "./properties-grid"

export default async function PropertiesPage() {
  const [user, properties] = await Promise.all([
    getCurrentUser(),
    getPropertiesWithSummary(),
  ])

  return (
    <PropertiesGrid properties={properties} userRole={user?.role ?? null} />
  )
}
