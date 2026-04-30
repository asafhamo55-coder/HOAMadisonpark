"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export function OnboardingSidebarLink({
  step,
  title,
  subtitle,
  done,
}: {
  step: number
  title: string
  subtitle: string
  done: boolean
}) {
  const pathname = usePathname()
  const href = `/onboarding/step-${step}`
  const isActive = pathname?.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border px-3 py-3 transition",
        isActive
          ? "border-emerald-500 bg-emerald-50"
          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
            done
              ? "bg-emerald-500 text-white"
              : isActive
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700",
          )}
          aria-hidden
        >
          {done ? <Check className="h-3 w-3" /> : step}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
    </Link>
  )
}
