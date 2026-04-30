import { requireTenantContext } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"

import { SettingsPageHeader } from "../_components/settings-page-header"
import { MembersList } from "./members-list"

type MemberRow = {
  user_id: string
  role: string
  status: string
  email: string | null
  full_name: string | null
}

type InviteRow = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

export default async function MembersPage() {
  const { tenantId, role } = await requireTenantContext()

  if (role !== "owner" && role !== "admin") {
    return (
      <p className="text-sm text-slate-600">
        Only owners and admins can manage members.
      </p>
    )
  }

  const supabase = createClient()

  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("user_id, role, status, profiles:profiles(email, full_name)")
    .eq("tenant_id", tenantId)
    .neq("status", "removed")

  const members: MemberRow[] = ((memberships ?? []) as Array<{
    user_id: string
    role: string
    status: string
    profiles:
      | { email: string | null; full_name: string | null }
      | Array<{ email: string | null; full_name: string | null }>
      | null
  }>).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      email: p?.email ?? null,
      full_name: p?.full_name ?? null,
    }
  })

  const { data: invites } = await supabase
    .from("tenant_invitations")
    .select("id, email, role, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <>
      <SettingsPageHeader
        title="Members & roles"
        description="Invite admins, board members, committee leads, residents, and vendors. Each role has different permissions throughout the app."
      />
      <MembersList
        members={members}
        invites={(invites ?? []) as InviteRow[]}
        currentRole={role}
      />
    </>
  )
}
