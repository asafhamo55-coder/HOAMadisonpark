"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, Eye } from "lucide-react"

import { pageTitles } from "@/components/dashboard/nav-config"
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

  // Find the most specific matching title
  const title =
    Object.entries(pageTitles)
      .filter(([path]) => pathname.startsWith(path))
      .sort(([a], [b]) => b.length - a.length)[0]?.[1] || "Dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-sm lg:px-8">
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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {/* View as Resident */}
        <Link href="/api/portal-preview">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:flex"
          >
            <Eye className="h-3.5 w-3.5" />
            View as Resident
          </Button>
        </Link>

        {/* Global search */}
        <GlobalSearch />

        {/* Notification bell with real-time updates */}
        <NotificationBell userId={userId} />

        {/* User avatar */}
        <Avatar className="h-8 w-8 ring-2 ring-slate-100 transition-all duration-200 hover:ring-indigo-100">
          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
          <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-medium text-indigo-700">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
