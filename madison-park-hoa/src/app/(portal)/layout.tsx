import { redirect } from "next/navigation"
import { cookies } from "next/headers"
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

  // Allow admin/board to preview portal via cookie
  const cookieStore = cookies()
  const previewMode = cookieStore.get("portal_preview")?.value === "true"

  // Non-residents should use the admin dashboard (unless previewing)
  if (user.role !== "resident" && !previewMode) {
    redirect("/dashboard")
  }

  return (
    <PortalShell
      user={{
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
      }}
      isPreview={previewMode && user.role !== "resident"}
    >
      {children}
    </PortalShell>
  )
}
