import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get("vendor_id")
  if (!vendorId) {
    return NextResponse.json({ jobs: [] })
  }

  const supabase = createClient()
  const { data } = await supabase
    .from("vendor_jobs")
    .select("id, title, status, scheduled_date, created_at, cost")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })

  return NextResponse.json({ jobs: data || [] })
}
