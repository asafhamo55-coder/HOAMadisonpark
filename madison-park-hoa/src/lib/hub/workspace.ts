import { cache } from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export type ModuleKey = "hoa" | "property" | "eviction"

export type Workspace = {
  id: string
  slug: string
  name: string
  type: "hoa" | "homeowner" | "property_manager" | "law_firm"
}

export type WorkspaceMembership = Workspace & {
  role: "owner" | "admin" | "manager" | "staff" | "viewer"
  modules: ModuleKey[]
}

const ACTIVE_WS_COOKIE = "hh_active_ws"

export const getMyWorkspaces = cache(async (): Promise<WorkspaceMembership[]> => {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = createClient()

  type MemberRow = {
    role: WorkspaceMembership["role"]
    workspace_id: string
    workspace: {
      id: string
      slug: string
      name: string
      type: Workspace["type"]
    }
  }
  type ModuleRow = {
    workspace_id: string
    module: ModuleKey
    status: string
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("role, workspace_id, workspace:workspaces(id, slug, name, type)")
    .eq("profile_id", user.id)
    .returns<MemberRow[]>()

  if (!members?.length) return []

  const workspaceIds = members.map((m) => m.workspace_id)
  const { data: modules } = await supabase
    .from("workspace_modules")
    .select("workspace_id, module, status")
    .in("workspace_id", workspaceIds)
    .returns<ModuleRow[]>()

  return members.map((m) => ({
    id: m.workspace.id,
    slug: m.workspace.slug,
    name: m.workspace.name,
    type: m.workspace.type,
    role: m.role,
    modules: (modules ?? [])
      .filter((mod) => mod.workspace_id === m.workspace_id && ["active", "trial"].includes(mod.status))
      .map((mod) => mod.module),
  }))
})

export async function getActiveWorkspace(): Promise<WorkspaceMembership | null> {
  const all = await getMyWorkspaces()
  if (all.length === 0) return null
  const cookieStore = cookies()
  const slug = cookieStore.get(ACTIVE_WS_COOKIE)?.value
  if (slug) {
    const match = all.find((w) => w.slug === slug)
    if (match) return match
  }
  return all[0]
}

export async function requireWorkspaceWithModule(
  module: ModuleKey
): Promise<WorkspaceMembership> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const ws = await getActiveWorkspace()
  if (!ws) redirect("/onboarding")
  if (!ws.modules.includes(module)) redirect(`/hub?missing=${module}`)
  return ws
}

export const ACTIVE_WORKSPACE_COOKIE = ACTIVE_WS_COOKIE
