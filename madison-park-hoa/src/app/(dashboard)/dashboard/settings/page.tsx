import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SettingsView } from "./settings-view"

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
  status?: "active" | "invited"
}

export type AuditEntry = {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export type HoaProfile = {
  name: string
  address: string
  phone: string
  email: string
  website: string
  logo_url: string
  board_president: string
}

export type DuesSettings = {
  default_amount: number
  grace_period_days: number
  late_fee_amount: number
}

export type ViolationCategoryConfig = {
  name: string
  default_severity: string
  due_date_offset_days: number
}

export default async function SettingsPage() {
  const user = await requireRole(["admin"])

  const supabase = createClient()
  const admin = createAdminClient()

  const [settingsRes, profilesRes, auditRes, authUsersRes] = await Promise.all([
    supabase.from("hoa_settings").select("key, value"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("full_name", { ascending: true }),
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const settingsMap: Record<string, unknown> = {}
  for (const row of settingsRes.data || []) {
    settingsMap[row.key] = row.value
  }

  const hoaProfile = (settingsMap.hoa_profile || {
    name: "Madison Park Homeowners Association",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    board_president: "",
  }) as HoaProfile

  const duesSettings = (settingsMap.dues_settings || {
    default_amount: 250,
    grace_period_days: 15,
    late_fee_amount: 25,
  }) as DuesSettings

  const violationCategories = (settingsMap.violation_categories ||
    []) as ViolationCategoryConfig[]

  // Merge auth users with profiles so invited-but-profileless users are visible
  const profilesById = new Map<string, Profile>()
  for (const p of (profilesRes.data || []) as Profile[]) {
    profilesById.set(p.id, { ...p, status: "active" })
  }

  const authUsers = authUsersRes.data?.users || []
  for (const au of authUsers) {
    if (!profilesById.has(au.id)) {
      // Auth user with no profile row — likely a stuck invite
      profilesById.set(au.id, {
        id: au.id,
        full_name: (au.user_metadata?.full_name as string) || null,
        email: au.email || null,
        role: (au.user_metadata?.role as string) || null,
        created_at: au.created_at,
        status: "invited",
      })
    }
  }

  const allProfiles = Array.from(profilesById.values()).sort((a, b) =>
    (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")
  )

  return (
    <SettingsView
      hoaProfile={hoaProfile}
      duesSettings={duesSettings}
      violationCategories={violationCategories}
      profiles={allProfiles}
      auditLog={(auditRes.data || []) as AuditEntry[]}
      currentUserId={user.id}
    />
  )
}
