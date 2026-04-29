import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { requireTenantContext } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"
import {
  getAdminDashboardData,
  getResidentDashboardData,
} from "./dashboard-data"
import { AdminDashboard } from "./admin-dashboard"
import { ResidentDashboard } from "./resident-dashboard"

export default async function DashboardPage() {
  // Membership-derived role is the source of truth post-Stream-A.
  const ctx = await requireTenantContext()

  // Residents shouldn't land on the dashboard root — they go to /portal.
  if (ctx.role === "resident") {
    redirect(tenantPath(ctx.tenantSlug, "portal"))
  }

  const isBoardOrAdmin =
    ctx.role === "admin" || ctx.role === "board" || ctx.role === "owner"

  if (isBoardOrAdmin) {
    const data = await getAdminDashboardData()
    return <AdminDashboard data={data} />
  }

  // Committee / readonly members get the resident-style read-only view
  // because the admin dashboard's editing UI assumes write access.
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const data = await getResidentDashboardData(user)
  return <ResidentDashboard data={data} />
}
