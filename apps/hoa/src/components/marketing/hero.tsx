import Link from "next/link"
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/brand"

const TRUST_POINTS = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
]

export function Hero() {
  return (
    <div className="gradient-mesh relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            SOC 2-aligned, row-level isolated, US-hosted
          </span>

          <h1 className="mt-6 text-4xl font-medium leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            {BRAND.tagline}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            {BRAND.name} is the all-in-one platform for HOAs, condo
            associations, and master-planned communities. Properties,
            violations, letters, payments, and resident self-service —{" "}
            <span className="font-medium text-slate-900">in one place</span>.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-[var(--tenant-primary)] px-8 text-base text-white hover:bg-[#1A3A5F]"
            >
              <Link href="/signup">
                Start free 14-day trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-300 px-8 text-base"
            >
              <Link href="/demo">See live demo</Link>
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {TRUST_POINTS.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <ProductMockup />
        </div>
      </div>
    </div>
  )
}

/**
 * Pure-SVG/CSS placeholder mockup of a dashboard. No image asset = no broken
 * src and no Lighthouse hit on LCP from a heavy hero image.
 */
function ProductMockup() {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5">
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-slate-400">
          {BRAND.name} · madison-park
        </span>
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-[200px_1fr]">
        <aside
          className="hidden rounded-lg p-3 text-xs text-slate-200 md:block"
          style={{ backgroundColor: "var(--tenant-primary)" }}
        >
          <div className="mb-3 font-semibold text-white">Madison Park</div>
          {[
            "Dashboard",
            "Properties",
            "Residents",
            "Violations",
            "Letters",
            "Payments",
            "Documents",
          ].map((item, i) => (
            <div
              key={item}
              className={`mb-1 rounded px-2 py-1 ${
                i === 0
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/70"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Active properties", value: "342", tone: "navy" },
              { label: "Open violations", value: "7", tone: "amber" },
              { label: "Past-due dues", value: "$4.2k", tone: "red" },
              { label: "Resident logins", value: "218", tone: "emerald" },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="text-xs text-slate-500">{card.label}</div>
                <div
                  className={`mt-1 text-lg font-semibold ${
                    card.tone === "amber"
                      ? "text-amber-600"
                      : card.tone === "red"
                        ? "text-red-600"
                        : card.tone === "emerald"
                          ? "text-emerald-600"
                          : "text-slate-900"
                  }`}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-900">
                Recent violations
              </div>
              <div className="text-xs text-slate-400">Last 7 days</div>
            </div>
            <div className="space-y-2">
              {[
                ["123 Sycamore Ln", "Unkempt lawn", "Open"],
                ["88 Oak Dr", "Trash bins curbside", "Notice sent"],
                ["410 Elm Ct", "Unapproved paint color", "ARC review"],
              ].map(([addr, kind, status]) => (
                <div
                  key={addr}
                  className="grid grid-cols-3 items-center gap-2 rounded border border-slate-100 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-700">{addr}</span>
                  <span className="text-slate-500">{kind}</span>
                  <span className="justify-self-end rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
