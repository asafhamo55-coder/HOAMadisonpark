import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { SettingsView } from "./settings-view"

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
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

  const [settingsRes, profilesRes, auditRes] = await Promise.all([
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

  return (
    <SettingsView
      hoaProfile={hoaProfile}
      duesSettings={duesSettings}
      violationCategories={violationCategories}
      profiles={(profilesRes.data || []) as Profile[]}
      auditLog={(auditRes.data || []) as AuditEntry[]}
      currentUserId={user.id}
    />
  )
}
