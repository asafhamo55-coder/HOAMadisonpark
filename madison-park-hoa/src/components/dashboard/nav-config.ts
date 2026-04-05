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
  BookOpen,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Properties & Residents",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    title: "Violations",
    href: "/dashboard/violations",
    icon: AlertTriangle,
  },
  {
    title: "Email Center",
    href: "/dashboard/email",
    icon: Mail,
  },
  {
    title: "Vendors",
    href: "/dashboard/vendors",
    icon: Wrench,
  },
  {
    title: "Announcements",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "Rules & Guidelines",
    href: "/dashboard/rules",
    icon: BookOpen,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    adminOnly: true,
  },
]

export const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/properties": "Properties & Residents",
  "/dashboard/violations": "Violations",
  "/dashboard/email": "Email Center",
  "/dashboard/vendors": "Vendors",
  "/dashboard/vendors/jobs": "Work Orders",
  "/dashboard/announcements": "Announcements",
  "/dashboard/documents": "Documents",
  "/dashboard/payments": "Payments",
  "/dashboard/rules": "Rules & Guidelines",
  "/dashboard/settings": "Settings",
}
