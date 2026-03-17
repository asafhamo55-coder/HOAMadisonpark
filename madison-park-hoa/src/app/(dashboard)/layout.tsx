import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/dashboard/app-shell"

async function getNotificationCount(): Promise<number> {
  try {
    const supabase = createClient()

    // Count open violations
    const { count: violationCount } = await supabase
      .from("violations")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")

    // Count overdue payments
    const { count: paymentCount } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "overdue")

    return (violationCount || 0) + (paymentCount || 0)
  } catch {
    // Tables may not exist yet; that's fine
    return 0
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const notificationCount = await getNotificationCount()

  return (
    <AppShell
      user={{
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      }}
      notificationCount={notificationCount}
    >
      {children}
    </AppShell>
  )
}
