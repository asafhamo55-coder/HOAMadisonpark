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
}: {
  user: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
  children: React.ReactNode
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Logo + HOA Name */}
          <Link href="/portal" className="flex items-center gap-3">
            <Image
              src={process.env.NEXT_PUBLIC_HOA_LOGO_URL || "/logo.svg"}
              alt="HOA"
              width={36}
              height={36}
              className="rounded"
            />
            <span className="hidden text-lg font-bold text-[#1e3a5f] sm:block">
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
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.title}</span>
                </Link>
              )
            })}

            {/* User menu */}
            <div className="ml-2 flex items-center gap-2 border-l pl-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white lg:hidden">
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
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-gray-500"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  )
}
