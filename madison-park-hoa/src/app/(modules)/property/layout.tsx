import {
  LayoutDashboard,
  Building,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Truck,
  Zap,
} from "lucide-react"
import { ModuleShell } from "@/components/hub/module-shell"
import { requireWorkspaceWithModule } from "@/lib/hub/workspace"

export const metadata = { title: "Property Management" }

const NAV = [
  { href: "/property", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/property/properties", label: "Properties", icon: <Building className="h-4 w-4" /> },
  { href: "/property/tenants", label: "Tenants", icon: <Users className="h-4 w-4" /> },
  { href: "/property/leases", label: "Leases", icon: <FileText className="h-4 w-4" /> },
  { href: "/property/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/property/maintenance", label: "Maintenance", icon: <Wrench className="h-4 w-4" /> },
  { href: "/property/vendors", label: "Vendors", icon: <Truck className="h-4 w-4" /> },
  { href: "/property/utilities", label: "Utilities", icon: <Zap className="h-4 w-4" /> },
]

export default async function PropertyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ws = await requireWorkspaceWithModule("property")
  return (
    <ModuleShell moduleName="Property Management" workspaceName={ws.name} nav={NAV}>
      {children}
    </ModuleShell>
  )
}
