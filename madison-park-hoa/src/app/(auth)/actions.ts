"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function getRole(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return profile?.role || null
}

export async function signUpAction(formData: FormData) {
  const supabase = createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (!data.user) return { error: "Could not create account." }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    email,
    role: "admin",
  })

  return { error: null }
}

export async function createWorkspaceAction(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const name = (formData.get("name") as string)?.trim()
  const type = (formData.get("type") as string) || "homeowner"
  const modulesRaw = formData.getAll("modules") as string[]
  if (!name) return { error: "Workspace name is required." }

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "workspace"
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  const { data: ws, error: wsErr } = await supabase
    .from("workspaces")
    .insert({ slug, name, type, owner_id: user.id })
    .select("id, slug")
    .single()
  if (wsErr || !ws) return { error: wsErr?.message || "Could not create workspace" }

  await supabase.from("workspace_members").insert({
    workspace_id: ws.id,
    profile_id: user.id,
    role: "owner",
  })

  const validModules = modulesRaw.filter((m) =>
    ["hoa", "property", "eviction"].includes(m)
  )
  if (validModules.length > 0) {
    await supabase.from("workspace_modules").insert(
      validModules.map((m) => ({
        workspace_id: ws.id,
        module: m,
        status: "trial",
        trial_ends_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
      }))
    )
  }

  return { ok: true, slug: ws.slug }
}

export async function resetPassword(formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string

  const headersList = headers()
  const origin = headersList.get("origin") || ""

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
