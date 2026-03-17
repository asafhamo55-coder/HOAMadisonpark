import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: "admin" | "board" | "resident" | "vendor" | null
  avatar_url: string | null
  created_at: string
}

/**
 * Returns the current authenticated user's profile (with role).
 * Returns null if not authenticated or no profile row exists.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  return profile as UserProfile
}

/**
 * Ensures the current user has one of the allowed roles.
 * Redirects to /dashboard if authenticated but wrong role,
 * or to /login if not authenticated at all.
 */
export async function requireRole(
  allowedRoles: UserProfile["role"][]
): Promise<UserProfile> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect("/dashboard")
  }

  return user
}
