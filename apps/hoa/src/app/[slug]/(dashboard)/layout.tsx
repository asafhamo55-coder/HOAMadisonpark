import { redirect } from "next/navigation"

import { requireTenantContext } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"
import { AppShell } from "@/components/dashboard/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireTenantContext()

  if (ctx.role === "resident") {
    redirect(tenantPath(ctx.tenantSlug, "portal"))
  }

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
        role: ctx.role,
        avatar_url: profile?.avatar_url ?? null,
      }}
      userId={user.id}
    >
      {children}
    </AppShell>
  )
}
