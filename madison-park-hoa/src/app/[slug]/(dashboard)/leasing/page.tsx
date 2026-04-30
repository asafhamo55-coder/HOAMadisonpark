import { getLeasingData } from "@/app/actions/leasing-waitlist"
import { requireTenantContext } from "@/lib/tenant"
import { LeasingView } from "./leasing-view"

export const dynamic = "force-dynamic"

export default async function LeasingPage() {
  const ctx = await requireTenantContext()

  const [leasingData, propertiesRes] = await Promise.all([
    getLeasingData(),
    ctx.supabase.from("properties").select("id, address").order("address"),
  ])

  return (
    <LeasingView
      waitlist={leasingData.waitlist}
      stats={leasingData.stats}
      properties={(propertiesRes.data || []) as { id: string; address: string }[]}
    />
  )
}
