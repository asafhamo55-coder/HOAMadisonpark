import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppShell } from "@/components/dashboard/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Residents should use the portal
  if (user.role === "resident") {
    redirect("/portal")
  }

  return (
    <AppShell
      user={{
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      }}
      userId={user.id}
    >
      {children}
    </AppShell>
  )
}
