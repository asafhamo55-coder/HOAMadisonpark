"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  Users,
  UserCircle,
  LogOut,
  BookOpen,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

const NAV_ITEMS = [
  { title: "My Home", href: "/portal", icon: Home },
  { title: "Community", href: "/portal/community", icon: Users },
  { title: "Rules", href: "/portal/rules", icon: BookOpen },
  { title: "Account", href: "/portal/account", icon: UserCircle },
]

export function PortalShell({
  user,
  children,
  isPreview = false,
}: {
  user: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
  children: React.ReactNode
  isPreview?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = (user.full_name || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  function exitPreview() {
    document.cookie = "portal_preview=; path=/; max-age=0"
    window.location.href = "/dashboard"
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Preview Banner */}
      {isPreview && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-white/80 animate-pulse" />
            <span>Previewing as Resident</span>
          </div>
          <button
            onClick={exitPreview}
            className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm transition-all hover:bg-white/30 hover:shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-[#0f172a] shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Logo + HOA Name */}
          <Link href="/portal" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 transition-all group-hover:bg-white/15 group-hover:ring-white/30">
              <Image
                src={process.env.NEXT_PUBLIC_HOA_LOGO_URL || "/logo.svg"}
                alt="HOA"
                width={24}
                height={24}
                className="rounded"
              />
            </div>
            <span className="hidden text-lg font-bold text-white sm:block">
              Madison Park HOA
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.title}</span>
                  {isActive && (
                    <span className="absolute -bottom-[9px] left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                  )}
                </Link>
              )
            })}

            {/* User menu */}
            <div className="ml-3 flex items-center gap-2 border-l border-white/10 pl-4">
              <Avatar className="h-8 w-8 ring-2 ring-white/10 transition-all hover:ring-white/25">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/80 backdrop-blur-xl lg:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 active:text-slate-600"
                }`}
              >
                <div className={`rounded-lg p-1 transition-colors duration-200 ${isActive ? "bg-indigo-50" : ""}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {item.title}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-slate-400 transition-colors active:text-slate-600"
          >
            <div className="rounded-lg p-1">
              <LogOut className="h-5 w-5" />
            </div>
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  )
}
