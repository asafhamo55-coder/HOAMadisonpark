"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { navItems } from "@/components/dashboard/nav-config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const roleBadgeColor: Record<string, string> = {
  admin: "bg-red-500/20 text-red-200 border-red-500/30",
  board: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  resident: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  vendor: "bg-blue-500/20 text-blue-200 border-blue-500/30",
}

export type SidebarUser = {
  full_name: string | null
  email: string | null
  role: string | null
  avatar_url: string | null
}

export function Sidebar({
  user,
  onLogout,
  onNavigate,
}: {
  user: SidebarUser
  onLogout: () => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && user.role !== "admin") return false
    return true
  })

  return (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-100">
      {/* Logo area with gradient accent */}
      <div className="relative flex h-16 items-center gap-3 px-5">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-violet-600/10" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
            <Image
              src={process.env.NEXT_PUBLIC_HOA_LOGO_URL || "/logo.svg"}
              alt="Logo"
              width={22}
              height={22}
              className="brightness-0 invert"
            />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            {process.env.NEXT_PUBLIC_HOA_NAME || "Madison Park HOA"}
          </span>
        </div>
      </div>

      {/* Subtle divider */}
      <div className="mx-4 border-t border-white/[0.06]" />

      {/* Nav items */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                )}
              >
                {/* Active indicator - left accent bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-violet-400" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-indigo-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Subtle divider */}
      <div className="mx-4 border-t border-white/[0.06]" />

      {/* User footer */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-2.5">
          <Avatar className="h-9 w-9 ring-2 ring-white/10">
            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback className="bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-xs font-medium text-white">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user.full_name || user.email || "User"}
            </p>
            {user.role && (
              <Badge
                variant="outline"
                className={cn(
                  "mt-0.5 text-[10px] capitalize",
                  roleBadgeColor[user.role] || ""
                )}
              >
                {user.role}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-8 w-8 shrink-0 rounded-lg text-slate-500 transition-all duration-200 hover:bg-white/[0.08] hover:text-slate-200"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
