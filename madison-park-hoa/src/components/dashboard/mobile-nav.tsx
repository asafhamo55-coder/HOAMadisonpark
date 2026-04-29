"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Building2, AlertTriangle, Mail, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTenant } from "@/components/tenant-provider"
import { tenantPath } from "@/lib/tenant-path"

const bottomNavItems = [
  { title: "Home", segment: "", icon: Home },
  { title: "Properties", segment: "properties", icon: Building2 },
  { title: "Violations", segment: "violations", icon: AlertTriangle },
  { title: "Email", segment: "email", icon: Mail },
] as const

export function MobileNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname()
  const { slug } = useTenant()
  const dashboardRoot = tenantPath(slug)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {bottomNavItems.map((item) => {
          const href = tenantPath(slug, item.segment)
          const isActive =
            (item.segment === "" && pathname === dashboardRoot) ||
            (item.segment !== "" &&
              (pathname === href || pathname.startsWith(`${href}/`)))

          return (
            <Link
              key={item.segment}
              href={href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 active:bg-muted/50",
                isActive ? "text-sidebar-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.title}</span>
            </Link>
          )
        })}
        <button
          onClick={onMoreClick}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 text-muted-foreground active:bg-muted/50"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </nav>
  )
}
