import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware behavior:
 *
 *   1. Refresh Supabase auth cookie on every request (existing behavior).
 *   2. Redirect unauthenticated users away from /dashboard, /portal
 *      (existing behavior).
 *   3. Redirect authenticated users away from /login, /reset-password
 *      (existing behavior).
 *   4. NEW: when the URL is /[slug]/... and `slug` matches a row in
 *      `tenants`, resolve tenant + verify membership and set the
 *      x-tenant-id / x-tenant-slug / x-user-role headers downstream.
 *      All existing single-tenant routes continue to work because
 *      the tenant resolver only fires when the first path segment is
 *      a real tenant slug.
 *
 * This is intentionally additive. The full route move under
 * /[slug]/(dashboard|portal|...) is owned by Stream G.
 */

// Path segments that are reserved app routes — never treated as a tenant slug.
const RESERVED_FIRST_SEGMENTS = new Set([
  "_next",
  "api",
  "favicon.ico",
  "fonts",
  "static",
  "public",

  // Existing single-tenant routes (pre-Stream-G):
  "dashboard",
  "portal",
  "login",
  "reset-password",
  "auth", // password-reset callback path

  // Stream A new public/auth routes:
  "select-tenant",
  "no-access",
  "accept-invite",
  "suspended",
  "404",

  // Future platform / marketing routes (Streams B / F):
  "platform",
  "onboarding",
  "pricing",
  "signup",
  "demo",
  "about",
  "legal",
])

function isPotentialTenantSlug(segment: string | undefined): boolean {
  if (!segment) return false
  if (RESERVED_FIRST_SEGMENTS.has(segment)) return false
  // Tenant slugs are lowercase letters/digits/hyphens, length 2-64.
  // Anything else is not a slug — let it 404 as a normal route.
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(segment)
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip everything if Supabase is not configured (e.g. local dev without env).
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // Refresh the session on every request (existing behavior).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]

  // ===== Existing single-tenant guards (unchanged) =====

  // Redirect unauthenticated users away from protected routes.
  if (
    !user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/portal"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages.
  if (user && (pathname === "/login" || pathname === "/reset-password")) {
    const url = request.nextUrl.clone()
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    url.pathname = profile?.role === "resident" ? "/portal" : "/dashboard"
    return NextResponse.redirect(url)
  }

  // ===== Tenant resolver (NEW — additive) =====
  //
  // If the first path segment looks like a slug AND matches a real tenant
  // row, set the tenant context headers so downstream server actions /
  // RSC can call getTenantContext() from lib/tenant.ts.
  //
  // If the slug segment doesn't match any tenant, we just fall through
  // to Next.js routing — the route either matches a real page or 404s.
  // This means a typo in a tenant slug shows the normal 404, which is
  // the desired UX.

  if (isPotentialTenantSlug(firstSegment)) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, status")
      .eq("slug", firstSegment)
      .is("deleted_at", null)
      .maybeSingle()

    if (tenant) {
      // Found a real tenant. Apply tenant guards.
      if (tenant.status === "suspended") {
        const url = request.nextUrl.clone()
        url.pathname = "/suspended"
        return NextResponse.redirect(url)
      }

      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("next", pathname)
        return NextResponse.redirect(url)
      }

      const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (!membership) {
        const url = request.nextUrl.clone()
        url.pathname = "/no-access"
        return NextResponse.redirect(url)
      }

      // Pass tenant context downstream via response headers AND request
      // headers (so RSC can read them via next/headers).
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-tenant-id", tenant.id)
      requestHeaders.set("x-tenant-slug", tenant.slug)
      requestHeaders.set("x-user-role", membership.role)

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      })
      // Mirror to response headers for any client that needs them.
      response.headers.set("x-tenant-id", tenant.id)
      response.headers.set("x-tenant-slug", tenant.slug)
      response.headers.set("x-user-role", membership.role)
      // Carry over the cookies that were set during session refresh.
      supabaseResponse.cookies.getAll().forEach((c) => {
        response.cookies.set(c.name, c.value, c)
      })
      return response
    }
    // No matching tenant — fall through to normal routing.
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any file path with an extension (.svg, .png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
