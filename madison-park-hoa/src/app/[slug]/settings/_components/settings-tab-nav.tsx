"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Palette,
  Mail,
  DollarSign,
  Gavel,
  ListChecks,
  FileText,
  ScrollText,
  BookOpen,
  Users,
  Plug,
  CreditCard,
  History,
  AlertTriangle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { TenantRole } from "@/lib/tenant"

type Tab = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Roles that may VIEW the tab. */
  allow: TenantRole[]
}

const ALL: TenantRole[] = ["owner", "admin", "board", "committee"]
const ADMIN: TenantRole[] = ["owner", "admin"]

const TABS: Tab[] = [
  { href: "general", label: "General", icon: Building2, allow: ALL },
  { href: "branding", label: "Branding", icon: Palette, allow: ALL },
  { href: "email", label: "Email", icon: Mail, allow: ALL },
  { href: "finance", label: "Finance", icon: DollarSign, allow: ALL },
  { href: "fine-schedule", label: "Fine schedule", icon: Gavel, allow: ALL },
  {
    href: "violation-categories",
    label: "Violation categories",
    icon: ListChecks,
    allow: ALL,
  },
  {
    href: "letter-templates",
    label: "Letter templates",
    icon: FileText,
    allow: ALL,
  },
  { href: "rules", label: "Rules & restrictions", icon: ScrollText, allow: ALL },
  { href: "knowledge-base", label: "Knowledge base", icon: BookOpen, allow: ALL },
  { href: "members", label: "Members & roles", icon: Users, allow: ADMIN },
  { href: "integrations", label: "Integrations", icon: Plug, allow: ADMIN },
  { href: "billing", label: "Billing", icon: CreditCard, allow: ADMIN },
  { href: "audit-log", label: "Audit log", icon: History, allow: ADMIN },
  {
    href: "danger-zone",
    label: "Danger zone",
    icon: AlertTriangle,
    allow: ["owner"],
  },
]

export function SettingsTabNav({
  slug,
  role,
}: {
  slug: string
  role: TenantRole
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {TABS.filter((t) => t.allow.includes(role)).map((tab) => {
        const href = `/${slug}/settings/${tab.href}`
        const isActive =
          pathname === href ||
          pathname?.startsWith(`${href}/`) === true
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-slate-100 font-medium text-slate-900"
                : "text-slate-700 hover:bg-slate-50",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive
                  ? "text-[var(--tenant-primary,#0F2A47)]"
                  : "text-slate-500 group-hover:text-slate-700",
              )}
            />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
