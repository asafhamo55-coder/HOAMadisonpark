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
