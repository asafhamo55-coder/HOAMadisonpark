import { getCurrentUser } from "@/lib/auth"
import { getJobsPageData } from "./page-data"
import { JobsView } from "./jobs-view"

export default async function VendorJobsPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getJobsPageData(),
  ])

  const canManage = user?.role === "admin" || user?.role === "board"

  return (
    <JobsView
      jobs={data.jobs}
      vendors={data.vendors}
      properties={data.properties}
      canManage={canManage}
    />
  )
}
