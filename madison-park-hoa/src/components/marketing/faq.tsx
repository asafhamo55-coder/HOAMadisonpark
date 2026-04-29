"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Collapsible FAQ list — server-rendered shell with a tiny client-side toggle
 * for each item. No external accordion dep needed.
 */
export function Faq({
  items,
  defaultOpen = 0,
}: {
  items: Array<{ q: string; a: string }>
  defaultOpen?: number
}) {
  const [open, setOpen] = useState<number>(defaultOpen)

  return (
    <ul className="mx-auto mt-12 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <li key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="text-base font-medium text-slate-900">
                {item.q}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-5 w-5 flex-none text-slate-400 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600">
                {item.a}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
