import { createClient } from "@/lib/supabase/server"
import type { UserProfile } from "@/lib/auth"

/* ── Shared types ─────────────────────────────────────────── */

export type StatCard = {
  label: string
  value: string | number
  href?: string
}

export type ViolationByCategory = {
  category: string
  count: number
}

export type ViolationByMonth = {
  month: string
  count: number
}

export type RecentViolation = {
  id: string
  property_address: string
  category: string
  reported_date: string
  status: string
}

export type RecentLetter = {
  id: string
  recipient_name: string
  subject: string
  sent_at: string
}

export type UpcomingJob = {
  id: string
  vendor_name: string
  property_address: string
  scheduled_date: string
  title: string
}

export type FeedAnnouncement = {
  id: string
  title: string
  body: string
  type: string
  published_at: string
}

export type AttentionProperty = {
  id: string
  address: string
  status: string
  open_violation_count: number
}

/* ── Admin / Board data ───────────────────────────────────── */

export type OccupancyBreakdown = {
  type: string
  count: number
}

export type AdminDashboardData = {
  stats: StatCard[]
  violationsByCategory: ViolationByCategory[]
  violationsByMonth: ViolationByMonth[]
  occupancyBreakdown: OccupancyBreakdown[]
  recentViolations: RecentViolation[]
  recentLetters: RecentLetter[]
  upcomingJobs: UpcomingJob[]
  announcements: FeedAnnouncement[]
  attentionProperties: AttentionProperty[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createClient()

  // Run all queries in parallel
  const [
    propertiesRes,
    openViolationsRes,
    pendingFinesRes,
    overduePaymentsRes,
    activeVendorsRes,
    violationsAllRes,
    recentViolationsRes,
    recentLettersRes,
    upcomingJobsRes,
    announcementsRes,
    propertiesFullRes,
    occupancyRes,
  ] = await Promise.all([
    // Stats
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("violations")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "notice_sent", "warning_sent"]),
    supabase
      .from("violations")
      .select("fine_amount")
      .eq("fine_paid", false)
      .not("fine_amount", "is", null)
      .gt("fine_amount", 0),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "overdue"),
    supabase
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    // Charts — all violations for category/month breakdown
    supabase
      .from("violations")
      .select("category, reported_date, status"),

    // Recent violations
    supabase
      .from("violations")
      .select("id, category, reported_date, status, properties(address)")
      .order("reported_date", { ascending: false })
      .limit(5),

    // Recent letters
    supabase
      .from("letters")
      .select("id, subject, sent_at, residents(full_name)")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(5),

    // Upcoming jobs (next 7 days)
    supabase
      .from("vendor_jobs")
      .select("id, title, scheduled_date, vendors(company_name), properties(address)")
      .gte("scheduled_date", new Date().toISOString().slice(0, 10))
      .lte(
        "scheduled_date",
        new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      )
      .in("status", ["scheduled", "approved"])
      .order("scheduled_date", { ascending: true })
      .limit(5),

    // Announcements
    supabase
      .from("announcements")
      .select("id, title, body, type, published_at, expires_at")
      .not("published_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(3),

    // Properties needing attention
    supabase
      .from("properties")
      .select("id, address, status"),

    // Occupancy type breakdown
    supabase
      .from("properties")
      .select("occupancy_type"),
  ])

  // Calculate stats
  const pendingFinesTotal = (pendingFinesRes.data || []).reduce(
    (sum, v) => sum + (Number(v.fine_amount) || 0),
    0
  )

  const stats: StatCard[] = [
    { label: "Total Properties", value: propertiesRes.count || 0 },
    {
      label: "Open Violations",
      value: openViolationsRes.count || 0,
      href: "/dashboard/violations?status=open",
    },
    {
      label: "Pending Fines",
      value: `$${pendingFinesTotal.toLocaleString()}`,
    },
    {
      label: "Overdue Payments",
      value: overduePaymentsRes.count || 0,
      href: "/dashboard/payments?status=overdue",
    },
    { label: "Active Vendors", value: activeVendorsRes.count || 0 },
  ]

  // Violations by category
  const categoryCounts: Record<string, number> = {}
  for (const v of violationsAllRes.data || []) {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1
  }
  const violationsByCategory = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // Violations by month (last 6 months)
  const now = new Date()
  const violationsByMonth: ViolationByMonth[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = d.toISOString().slice(0, 7) // "YYYY-MM"
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
    const count = (violationsAllRes.data || []).filter((v) =>
      v.reported_date?.startsWith(monthKey)
    ).length
    violationsByMonth.push({ month: label, count })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentViolations: RecentViolation[] = (recentViolationsRes.data || []).map((v: any) => ({
    id: v.id,
    property_address: v.properties?.address || "—",
    category: v.category,
    reported_date: v.reported_date,
    status: v.status,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentLetters: RecentLetter[] = (recentLettersRes.data || []).map((l: any) => ({
    id: l.id,
    recipient_name: l.residents?.full_name || "—",
    subject: l.subject,
    sent_at: l.sent_at,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingJobs: UpcomingJob[] = (upcomingJobsRes.data || []).map((j: any) => ({
    id: j.id,
    vendor_name: j.vendors?.company_name || "—",
    property_address: j.properties?.address || "—",
    scheduled_date: j.scheduled_date,
    title: j.title,
  }))

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const announcements: FeedAnnouncement[] = (announcementsRes.data || [])
    .filter((a: any) => !a.expires_at || new Date(a.expires_at) >= new Date())
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      type: a.type,
      published_at: a.published_at,
    }))
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Properties needing attention: vacant, foreclosure, or 2+ open violations
  const openViolationsByProp: Record<string, number> = {}
  for (const v of violationsAllRes.data || []) {
    if (["open", "notice_sent", "warning_sent"].includes(v.status)) {
      // We need property_id — but we only have category/date/status.
      // Let's use recentViolationsRes for the property mapping.
    }
  }
  // Re-query open violations grouped by property for attention list
  const { data: openViolsData } = await supabase
    .from("violations")
    .select("property_id")
    .in("status", ["open", "notice_sent", "warning_sent"])
  for (const v of openViolsData || []) {
    openViolationsByProp[v.property_id] = (openViolationsByProp[v.property_id] || 0) + 1
  }

  const attentionProperties: AttentionProperty[] = (propertiesFullRes.data || [])
    .filter(
      (p) =>
        p.status === "vacant" ||
        p.status === "foreclosure" ||
        (openViolationsByProp[p.id] || 0) >= 2
    )
    .map((p) => ({
      id: p.id,
      address: p.address,
      status: p.status,
      open_violation_count: openViolationsByProp[p.id] || 0,
    }))
    .slice(0, 10)

  // Occupancy breakdown
  const occupancyCounts: Record<string, number> = {}
  for (const p of occupancyRes.data || []) {
    const t = (p.occupancy_type as string) || "owner_occupied"
    occupancyCounts[t] = (occupancyCounts[t] || 0) + 1
  }
  const occupancyBreakdown: OccupancyBreakdown[] = Object.entries(occupancyCounts).map(
    ([type, count]) => ({ type, count })
  )

  return {
    stats,
    violationsByCategory,
    violationsByMonth,
    occupancyBreakdown,
    recentViolations,
    recentLetters,
    upcomingJobs,
    announcements,
    attentionProperties,
  }
}

/* ── Resident data ────────────────────────────────────────── */

export type ResidentDashboardData = {
  propertyAddress: string | null
  propertyId: string | null
  openViolations: Array<{
    id: string
    category: string
    description: string
    status: string
    reported_date: string
    due_date: string | null
  }>
  paymentStatus: {
    nextDue: { amount: number; due_date: string; status: string } | null
    overdue: number
  }
  recentLetters: Array<{
    id: string
    subject: string
    sent_at: string
    type: string
  }>
  announcements: FeedAnnouncement[]
}

export async function getResidentDashboardData(
  user: UserProfile
): Promise<ResidentDashboardData> {
  const supabase = createClient()

  // Find the resident's property
  const { data: residentData } = await supabase
    .from("residents")
    .select("property_id, properties(id, address)")
    .eq("profile_id", user.id)
    .eq("is_current", true)
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (residentData as any)?.properties
  const propertyId = residentData?.property_id || null
  const propertyAddress = property?.address || null

  const [violationsRes, paymentsRes, lettersRes, announcementsRes] =
    await Promise.all([
      // My open violations
      propertyId
        ? supabase
            .from("violations")
            .select("id, category, description, status, reported_date, due_date")
            .eq("property_id", propertyId)
            .in("status", [
              "open",
              "notice_sent",
              "warning_sent",
              "fine_issued",
            ])
            .order("reported_date", { ascending: false })
        : Promise.resolve({ data: [] }),

      // My payments
      propertyId
        ? supabase
            .from("payments")
            .select("amount, due_date, status")
            .eq("property_id", propertyId)
            .order("due_date", { ascending: true })
        : Promise.resolve({ data: [] }),

      // Letters sent to me
      propertyId
        ? supabase
            .from("letters")
            .select("id, subject, sent_at, type")
            .eq("property_id", propertyId)
            .eq("status", "sent")
            .order("sent_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // Announcements
      supabase
        .from("announcements")
        .select("id, title, body, type, published_at, expires_at")
        .not("published_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const payments = paymentsRes.data || []
  const nextDue = payments.find(
    (p) => p.status === "pending" || p.status === "overdue"
  )
  const overdueCount = payments.filter((p) => p.status === "overdue").length

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const announcements = (announcementsRes.data || [])
    .filter((a: any) => !a.expires_at || new Date(a.expires_at) >= new Date())
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      type: a.type,
      published_at: a.published_at,
    }))
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    propertyAddress,
    propertyId,
    openViolations: (violationsRes.data || []) as ResidentDashboardData["openViolations"],
    paymentStatus: {
      nextDue: nextDue
        ? {
            amount: Number(nextDue.amount),
            due_date: nextDue.due_date,
            status: nextDue.status,
          }
        : null,
      overdue: overdueCount,
    },
    recentLetters: (lettersRes.data || []) as ResidentDashboardData["recentLetters"],
    announcements,
  }
}
