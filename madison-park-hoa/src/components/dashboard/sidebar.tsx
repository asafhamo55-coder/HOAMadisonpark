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
import { Separator } from "@/components/ui/separator"
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <Image
          src={process.env.NEXT_PUBLIC_HOA_LOGO_URL || "/logo.svg"}
          alt="Logo"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <span className="text-sm font-semibold tracking-tight">
          {process.env.NEXT_PUBLIC_HOA_NAME || "Madison Park HOA"}
        </span>
      </div>

      <Separator className="bg-sidebar-muted" />

      {/* Nav items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-muted" />

      {/* User footer */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback className="bg-sidebar-muted text-xs text-sidebar-foreground">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
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
            className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-muted hover:text-sidebar-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
