import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  getAdminDashboardData,
  getResidentDashboardData,
} from "./dashboard-data"
import { AdminDashboard } from "./admin-dashboard"
import { ResidentDashboard } from "./resident-dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const isBoardOrAdmin = user.role === "admin" || user.role === "board"

  if (isBoardOrAdmin) {
    const data = await getAdminDashboardData()
    return <AdminDashboard data={data} />
  }

  const data = await getResidentDashboardData(user)
  return <ResidentDashboard data={data} />
}
