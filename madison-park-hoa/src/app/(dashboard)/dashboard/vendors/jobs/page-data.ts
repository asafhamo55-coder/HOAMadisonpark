import { createClient } from "@/lib/supabase/server"

export type VendorOption = {
  id: string
  company_name: string
}

export type PropertyOption = {
  id: string
  address: string
}

export type WorkOrder = {
  id: string
  vendor_id: string
  property_id: string | null
  title: string
  description: string | null
  status: string
  scheduled_date: string | null
  completed_date: string | null
  cost: string | null
  notes: string | null
  created_at: string
  vendor_name: string
  property_address: string | null
}

export type JobsPageData = {
  jobs: WorkOrder[]
  vendors: VendorOption[]
  properties: PropertyOption[]
}

export async function getJobsPageData(): Promise<JobsPageData> {
  const supabase = createClient()

  const [jobsRes, vendorsRes, propertiesRes] = await Promise.all([
    supabase
      .from("vendor_jobs")
      .select("*, vendors(company_name), properties(address)")
      .order("created_at", { ascending: false }),
    supabase
      .from("vendors")
      .select("id, company_name")
      .eq("is_active", true)
      .order("company_name"),
    supabase.from("properties").select("id, address").order("address"),
  ])

  const jobs: WorkOrder[] = (jobsRes.data || []).map((j: Record<string, unknown>) => ({
    id: j.id as string,
    vendor_id: j.vendor_id as string,
    property_id: j.property_id as string | null,
    title: j.title as string,
    description: j.description as string | null,
    status: j.status as string,
    scheduled_date: j.scheduled_date as string | null,
    completed_date: j.completed_date as string | null,
    cost: j.cost as string | null,
    notes: j.notes as string | null,
    created_at: j.created_at as string,
    vendor_name: (j.vendors as { company_name: string } | null)?.company_name || "Unknown",
    property_address: (j.properties as { address: string } | null)?.address || null,
  }))

  return {
    jobs,
    vendors: (vendorsRes.data || []) as VendorOption[],
    properties: (propertiesRes.data || []) as PropertyOption[],
  }
}
