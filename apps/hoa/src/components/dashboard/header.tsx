"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { pageTitles } from "@/components/dashboard/nav-config"
import { useTenant } from "@/components/tenant-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { NotificationBell } from "@/components/dashboard/notification-bell"

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Header({
  user,
  userId,
  onMenuClick,
}: {
  user: {
    full_name: string | null
    avatar_url: string | null
  }
  userId: string
  onMenuClick: () => void
}) {
  const pathname = usePathname()
  const { slug } = useTenant()

  // Strip the leading /<slug> so the static `pageTitles` table can match.
  const tenantPrefix = `/${slug}`
  const tenantRelativePath = pathname.startsWith(tenantPrefix)
    ? pathname.slice(tenantPrefix.length) || "/"
    : pathname

  // Find the most specific matching title
  const title =
    Object.entries(pageTitles)
      .filter(([path]) => tenantRelativePath.startsWith(path))
      .sort(([a], [b]) => b.length - a.length)[0]?.[1] || "Dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold md:text-xl">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {/* Global search */}
        <GlobalSearch />

        {/* Notification bell with real-time updates */}
        <NotificationBell userId={userId} />

        {/* User avatar */}
        <Avatar className="h-8 w-8">
          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
          <AvatarFallback className="text-xs">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
