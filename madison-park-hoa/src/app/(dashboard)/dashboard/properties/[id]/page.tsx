import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPropertyDetail } from "./detail-data"
import { PropertyDetailView } from "./property-detail"

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getPropertyDetail(params.id),
  ])

  if (!data) notFound()

  const canManage = user?.role === "admin" || user?.role === "board"

  return <PropertyDetailView data={data} canManage={canManage} />
}
