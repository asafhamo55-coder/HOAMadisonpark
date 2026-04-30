"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Minus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  PLANS,
  ENTERPRISE,
  COMPARISON_MATRIX,
  type Plan,
} from "@/lib/brand"
import { cn } from "@/lib/utils"

type Cycle = "monthly" | "annual"

export function PricingGrid() {
  const [cycle, setCycle] = useState<Cycle>("monthly")

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm">
          {(["monthly", "annual"] as Cycle[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cycle === c}
              className={cn(
                "rounded-full px-5 py-1.5 font-medium transition-colors",
                cycle === c
                  ? "bg-[var(--tenant-primary)] text-white"
                  : "text-slate-600 hover:text-slate-900",
              )}
              onClick={() => setCycle(c)}
            >
              {c === "monthly" ? "Monthly" : "Annual"}
              {c === "annual" && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  save 17%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.slug} plan={plan} cycle={cycle} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Prices in USD, pre-tax. Annual is billed once per year and saves 17%
        versus monthly. Cancel anytime — pro-rated refund on annual.
      </p>

      <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Managing 1,500+ doors across multiple communities?
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {ENTERPRISE.description}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href={ENTERPRISE.cta.href}>{ENTERPRISE.cta.label}</Link>
        </Button>
      </div>

      <ComparisonMatrix />
    </div>
  )
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: Cycle }) {
  const showAnnual = cycle === "annual"
  const displayPrice =
    plan.monthly === null
      ? null
      : showAnnual
        ? plan.annual
        : plan.monthly

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-6",
        plan.featured
          ? "border-[var(--tenant-primary)] shadow-lg ring-2 ring-[var(--tenant-primary)]/15"
          : "border-slate-200",
      )}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
        {plan.featured && (
          <span className="rounded-full bg-[var(--tenant-primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

      <div className="mt-5">
        {displayPrice === 0 ? (
          <p className="text-3xl font-semibold tracking-tight text-slate-900">
            Free
          </p>
        ) : (
          <p>
            <span className="text-3xl font-semibold tracking-tight text-slate-900">
              ${displayPrice}
            </span>
            <span className="text-sm text-slate-500">
              /mo{showAnnual ? ", billed yearly" : ""}
            </span>
          </p>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {plan.properties} · {plan.seats}
      </p>

      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-4 w-4 flex-none text-emerald-600"
              aria-hidden="true"
            />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={cn(
          "mt-6 w-full",
          plan.featured &&
            "bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]",
        )}
        variant={plan.featured ? "default" : "outline"}
      >
        <Link href={plan.cta.href}>{plan.cta.label}</Link>
      </Button>
    </div>
  )
}

function ComparisonMatrix() {
  return (
    <div className="mt-20">
      <h3 className="font-display text-2xl font-medium text-slate-900">
        Full feature comparison
      </h3>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-4">Feature</th>
              <th className="px-5 py-4">Trial</th>
              <th className="px-5 py-4">Starter</th>
              <th className="px-5 py-4">Standard</th>
              <th className="px-5 py-4">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COMPARISON_MATRIX.map((group) => (
              <>
                <tr key={`${group.group}-head`} className="bg-slate-50/60">
                  <th
                    colSpan={5}
                    className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={`${group.group}-${row.label}`}>
                    <td className="px-5 py-3 text-slate-700">{row.label}</td>
                    <Cell value={row.trial} />
                    <Cell value={row.starter} />
                    <Cell value={row.standard} />
                    <Cell value={row.pro} />
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <td className="px-5 py-3">
        <Check
          className="h-4 w-4 text-emerald-600"
          aria-label="Included"
        />
      </td>
    )
  }
  if (value === false) {
    return (
      <td className="px-5 py-3">
        <Minus
          className="h-4 w-4 text-slate-300"
          aria-label="Not included"
        />
      </td>
    )
  }
  return <td className="px-5 py-3 text-slate-700">{value}</td>
}
