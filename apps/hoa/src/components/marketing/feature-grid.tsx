import Link from "next/link"
import {
  Building2,
  AlertTriangle,
  FileText,
  Wallet,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react"

import { FEATURE_AREAS } from "@/lib/brand"

const ICONS = {
  properties: Building2,
  violations: AlertTriangle,
  letters: FileText,
  payments: Wallet,
  portal: Users,
  documents: BookOpen,
} as const

export function FeatureGrid() {
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURE_AREAS.map((feat) => {
        const Icon = ICONS[feat.slug as keyof typeof ICONS]
        return (
          <Link
            key={feat.slug}
            href={`/features/${feat.slug}`}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "rgba(15, 42, 71, 0.08)",
                color: "var(--tenant-primary)",
              }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {feat.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{feat.short}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium accent-text group-hover:underline">
              Learn more
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
