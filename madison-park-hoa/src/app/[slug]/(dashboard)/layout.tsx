import { redirect } from "next/navigation"

import { requireTenantContext } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"
import { AppShell } from "@/components/dashboard/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Tenant + membership verified by middleware; this resolves the role.
  const ctx = await requireTenantContext()

  // Residents should use the resident portal for this tenant.
  if (ctx.role === "resident") {
    redirect(tenantPath(ctx.tenantSlug, "portal"))
  }

  // Pull profile chrome for the AppShell sidebar.
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
    <AppShell
      user={{
        full_name: profile?.full_name ?? user.email ?? null,
        email: profile?.email ?? user.email ?? null,
        // Tenant role takes precedence over the legacy global profile role,
        // since membership-derived role is the source of truth post-Stream-A.
        role: ctx.role,
        avatar_url: profile?.avatar_url ?? null,
      }}
      userId={user.id}
    >
      {children}
    </AppShell>
  )
}
