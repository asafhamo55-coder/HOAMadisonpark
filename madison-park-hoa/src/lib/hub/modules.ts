import { Building, Building2, Gavel } from "lucide-react"
import type { ComponentType } from "react"
import type { ModuleKey } from "./workspace"

export type ModuleDescriptor = {
  key: ModuleKey
  name: string
  tagline: string
  href: string
  icon: ComponentType<{ className?: string }>
  color: string
}

export const MODULES: Record<ModuleKey, ModuleDescriptor> = {
  hoa: {
    key: "hoa",
    name: "HOA Hub",
    tagline: "Run your homeowners association.",
    href: "/dashboard",
    icon: Building2,
    color: "text-blue-600",
  },
  property: {
    key: "property",
    name: "Property Management",
    tagline: "Tenants, leases, rent, maintenance.",
    href: "/property",
    icon: Building,
    color: "text-emerald-600",
  },
  eviction: {
    key: "eviction",
    name: "Eviction Hub",
    tagline: "Stage-by-stage workflow per jurisdiction.",
    href: "/eviction",
    icon: Gavel,
    color: "text-rose-600",
  },
}

export const ALL_MODULES: ModuleDescriptor[] = [
  MODULES.hoa,
  MODULES.property,
  MODULES.eviction,
]
