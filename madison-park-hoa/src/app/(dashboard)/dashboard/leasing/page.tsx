import { createClient } from "@/lib/supabase/server"
import { getLeasingData } from "@/app/actions/leasing-waitlist"
import { LeasingView } from "./leasing-view"

export default async function LeasingPage() {
  const supabase = createClient()

  const [leasingData, propertiesRes] = await Promise.all([
    getLeasingData(),
    supabase
      .from("properties")
      .select("id, address")
      .order("address"),
  ])

  return (
    <LeasingView
      waitlist={leasingData.waitlist}
      stats={leasingData.stats}
      properties={(propertiesRes.data || []) as { id: string; address: string }[]}
    />
  )
}
