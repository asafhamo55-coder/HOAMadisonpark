import { getCurrentUser } from "@/lib/auth"
import { getViolationsPageData } from "./page-data"
import { ViolationsView } from "./violations-view"

export default async function ViolationsPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getViolationsPageData(),
  ])

  const canManage = user?.role === "admin" || user?.role === "board"

  return (
    <ViolationsView
      violations={data.violations}
      stats={data.stats}
      properties={data.properties}
      residents={data.residents}
      canManage={canManage}
    />
  )
}
