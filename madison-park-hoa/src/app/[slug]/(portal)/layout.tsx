import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PortalShell } from "./portal-shell"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Non-residents should use the admin dashboard
  if (user.role !== "resident") {
    redirect("/dashboard")
  }

  return (
    <PortalShell
      user={{
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
      }}
    >
      {children}
    </PortalShell>
  )
}
