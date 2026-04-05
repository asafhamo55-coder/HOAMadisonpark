import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"
  const origin = request.nextUrl.origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is a password recovery flow
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Redirect to update password page for recovery flows
        return NextResponse.redirect(`${origin}/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
