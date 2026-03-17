import { requireRole } from "@/lib/auth"
import { getBroadcastPageData } from "./page-data"
import { BroadcastView } from "./broadcast-view"

export default async function BroadcastPage() {
  await requireRole(["admin", "board"])
  const data = await getBroadcastPageData()

  return (
    <BroadcastView residents={data.residents} streets={data.streets} />
  )
}
