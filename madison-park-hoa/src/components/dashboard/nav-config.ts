import {
  Home,
  Building2,
  AlertTriangle,
  Mail,
  Wrench,
  Megaphone,
  FileText,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react"

/**
 * Per-module navigation entries. Hrefs are tenant-agnostic — they are
 * appended to the active tenant slug at render time via
 * `tenantPath(slug, segment)`. The `segment` field is what `tenantPath`
 * receives; an empty segment means the dashboard root (`/<slug>`).
 */
export type NavItem = {
  title: string
  /** Path segment under `/[slug]/...`. Empty string = dashboard root. */
  segment: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { title: "Dashboard", segment: "", icon: Home },
  { title: "Properties & Residents", segment: "properties", icon: Building2 },
  { title: "Violations", segment: "violations", icon: AlertTriangle },
  { title: "Email Center", segment: "email", icon: Mail },
  { title: "Vendors", segment: "vendors", icon: Wrench },
  { title: "Announcements", segment: "announcements", icon: Megaphone },
  { title: "Documents", segment: "documents", icon: FileText },
  { title: "Payments", segment: "payments", icon: CreditCard },
  { title: "Settings", segment: "settings", icon: Settings, adminOnly: true },
]

/**
 * Mapping from tenant-relative path -> human-readable page title.
 * Used by the header breadcrumb. Lookup is performed against
 * `pathname.replace(\`/${slug}\`, "")`.
 */
export const pageTitles: Record<string, string> = {
  "": "Dashboard",
  "/": "Dashboard",
  "/properties": "Properties & Residents",
  "/violations": "Violations",
  "/email": "Email Center",
  "/vendors": "Vendors",
  "/vendors/jobs": "Work Orders",
  "/announcements": "Announcements",
  "/documents": "Documents",
  "/payments": "Payments",
  "/settings": "Settings",
}
