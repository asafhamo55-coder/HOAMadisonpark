"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Building2, AlertTriangle, Mail, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const bottomNavItems = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "Properties", href: "/dashboard/properties", icon: Building2 },
  { title: "Violations", href: "/dashboard/violations", icon: AlertTriangle },
  { title: "Email", href: "/dashboard/email", icon: Mail },
  { title: "More", href: "#more", icon: MoreHorizontal },
]

export function MobileNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {bottomNavItems.map((item) => {
          if (item.href === "#more") {
            return (
              <button
                key={item.href}
                onClick={onMoreClick}
                className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 text-muted-foreground active:bg-muted/50"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.title}</span>
              </button>
            )
          }

          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 active:bg-muted/50",
                isActive
                  ? "text-sidebar-accent"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
