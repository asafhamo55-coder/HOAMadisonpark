import { redirect } from "next/navigation"

import { requireTenantContext } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"
import { PortalShell } from "./portal-shell"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Tenant + membership are already verified by middleware. We pull the
  // tenant context here so we can read the user's role within this tenant.
  const ctx = await requireTenantContext()

  // Non-residents should use the admin dashboard for this tenant.
  if (ctx.role !== "resident") {
    redirect(tenantPath(ctx.tenantSlug))
  }

  // Pull the auth user for header chrome (avatar / display name).
  const {
    data: { user },
  } = await ctx.supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <PortalShell
      user={{
        full_name: profile?.full_name ?? user.email ?? null,
        email: profile?.email ?? user.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    >
      {children}
    </PortalShell>
  )
}
