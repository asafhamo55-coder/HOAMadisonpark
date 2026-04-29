"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { listMyTenants } from "@/lib/tenant"

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

/**
 * Send a passwordless magic-link email. The link redirects back to
 * /auth/callback which lands the user on /onboarding (or wherever
 * resolvePostLoginPath says, after Stream A's callback handler is wired).
 */
export async function loginWithMagicLink(formData: FormData) {
  const supabase = createClient()
  const email = formData.get("email") as string

  const headersList = headers()
  const origin =
    headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || ""

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/post-login`,
    },
  })

  if (error) {
    return { error: error.message }
  }
  return { error: null }
}

/**
 * Begin a Google OAuth flow. Returns the URL for the client to navigate to.
 * Stream A's `/auth/callback` handles the code exchange and redirects.
 */
export async function startGoogleOAuth() {
  const supabase = createClient()

  const headersList = headers()
  const origin =
    headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || ""

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/post-login`,
    },
  })

  if (error) return { url: null, error: error.message }
  return { url: data?.url ?? null, error: null }
}

/**
 * Post-login route resolver. Used by /post-login (a server route that runs
 * once Supabase has set the session cookie) to decide where to send the user:
 *   - 0 active memberships -> /onboarding (finish setting up first tenant)
 *   - 1 active membership   -> /<slug>
 *   - 2+ active memberships -> /select-tenant
 *
 * Returns "/login" if for some reason the session isn't yet present, so the
 * caller can redirect the user back into the auth flow.
 */
export async function resolvePostLoginPath(): Promise<string> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return "/login"

  const tenants = await listMyTenants()
  if (tenants.length === 0) return "/onboarding"
  if (tenants.length === 1) return `/${tenants[0].slug}`
  return "/select-tenant"
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
