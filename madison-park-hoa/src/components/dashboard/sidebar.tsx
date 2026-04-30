"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Building, Building2, Gavel, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { navItems } from "@/components/dashboard/nav-config"
import { useTenant } from "@/components/tenant-provider"
import { tenantPath } from "@/lib/tenant-path"
import type { ModuleKey } from "@/lib/modules"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

const MODULE_DEFS: Record<
  ModuleKey,
  { label: string; segment: string; icon: typeof Building2 }
> = {
  hoa: { label: "HOA Hub", segment: "", icon: Building2 },
  property: { label: "Property Mgmt", segment: "property", icon: Building },
  eviction: { label: "Eviction Hub", segment: "eviction", icon: Gavel },
}

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
  activeModules,
  onLogout,
  onNavigate,
}: {
  user: SidebarUser
  activeModules?: ModuleKey[]
  onLogout: () => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { slug, tenantName } = useTenant()
  const dashboardRoot = tenantPath(slug)

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && user.role !== "admin") return false
    return true
  })

  const showModuleSwitcher = (activeModules?.length ?? 0) > 1

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
          {tenantName}
        </span>
      </div>

      <Separator className="bg-sidebar-muted" />

      {showModuleSwitcher && (
        <>
          <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Modules
          </div>
          <nav className="flex flex-col gap-1 px-2 pb-2">
            {(["hoa", "property", "eviction"] as ModuleKey[])
              .filter((k) => activeModules!.includes(k))
              .map((key) => {
                const def = MODULE_DEFS[key]
                const href = tenantPath(slug, def.segment)
                const isActive =
                  key === "hoa"
                    ? !pathname.startsWith(`${dashboardRoot}/property`) &&
                      !pathname.startsWith(`${dashboardRoot}/eviction`)
                    : pathname.startsWith(`${dashboardRoot}/${def.segment}`)
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                    )}
                  >
                    <def.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{def.label}</span>
                  </Link>
                )
              })}
          </nav>
          <Separator className="bg-sidebar-muted" />
        </>
      )}

      {/* Nav items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
          {filteredItems.map((item) => {
            const href = tenantPath(slug, item.segment)
            const isActive =
              pathname === href ||
              (item.segment !== "" && pathname.startsWith(`${href}/`)) ||
              (item.segment !== "" && pathname === href) ||
              (item.segment === "" && pathname === dashboardRoot)

            return (
              <Link
                key={item.segment}
                href={href}
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
