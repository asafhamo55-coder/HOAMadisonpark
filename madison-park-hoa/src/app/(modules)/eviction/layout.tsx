import { LayoutDashboard, Files, Map } from "lucide-react"
import { ModuleShell } from "@/components/hub/module-shell"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"

export const metadata = { title: "Eviction Hub" }

const NAV = [
  { href: "/eviction", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/eviction/cases", label: "Cases", icon: <Files className="h-4 w-4" /> },
  { href: "/eviction/jurisdictions", label: "Jurisdictions", icon: <Map className="h-4 w-4" /> },
]

export default async function EvictionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ws = await requireWorkspaceWithModule("eviction")
  return (
    <ModuleShell moduleName="Eviction Hub" workspaceName={ws.name} nav={NAV}>
      {children}
    </ModuleShell>
  )
}
