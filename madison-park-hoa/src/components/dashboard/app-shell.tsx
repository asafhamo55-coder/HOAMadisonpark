"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { Sidebar, type SidebarUser } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export function AppShell({
  user,
  userId,
  children,
}: {
  user: SidebarUser
  userId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar
            user={user}
            onLogout={handleLogout}
            onNavigate={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          userId={userId}
          onMenuClick={() => setSheetOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-muted/30 pb-20 lg:pb-0">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav onMoreClick={() => setSheetOpen(true)} />
    </div>
  )
}
