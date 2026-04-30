import { getCurrentUser } from "@/lib/auth"
import { getVendorsPageData } from "./page-data"
import { VendorsView } from "./vendors-view"

export default async function VendorsPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getVendorsPageData(),
  ])

  const canManage = user?.role === "admin" || user?.role === "board"

  return (
    <VendorsView
      vendors={data.vendors}
      canManage={canManage}
    />
  )
}
