import { createClient } from "@/lib/supabase/server"

export type Vendor = {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  category: string | null
  address: string | null
  license_number: string | null
  insurance_expiry: string | null
  rating: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  active_jobs_count: number
}

export type PropertyOption = {
  id: string
  address: string
}

export type VendorsPageData = {
  vendors: Vendor[]
  properties: PropertyOption[]
}

export async function getVendorsPageData(): Promise<VendorsPageData> {
  const supabase = createClient()

  const [vendorsRes, jobsRes, propertiesRes] = await Promise.all([
    supabase
      .from("vendors")
      .select("*")
      .order("company_name"),

    supabase
      .from("vendor_jobs")
      .select("vendor_id, status")
      .in("status", ["requested", "approved", "scheduled", "in_progress"]),

    supabase
      .from("properties")
      .select("id, address")
      .order("address"),
  ])

  const rawVendors = vendorsRes.data || []
  const jobs = jobsRes.data || []

  // Count active jobs per vendor
  const jobCounts = new Map<string, number>()
  for (const j of jobs) {
    jobCounts.set(j.vendor_id, (jobCounts.get(j.vendor_id) || 0) + 1)
  }

  const vendors: Vendor[] = rawVendors.map((v) => ({
    ...v,
    active_jobs_count: jobCounts.get(v.id) || 0,
  }))

  return {
    vendors,
    properties: (propertiesRes.data || []) as PropertyOption[],
  }
}
