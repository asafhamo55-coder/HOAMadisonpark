"use client"

import { useState } from "react"
import { ArrowRight, RotateCcw } from "lucide-react"

type Product = "hoa" | "property" | "eviction"

const PRODUCT_INFO: Record<Product, { name: string; href: string; why: string }> = {
  hoa: {
    name: "HOA Management Hub",
    href: process.env.NEXT_PUBLIC_HOA_URL ?? "https://hoa.homeowner-hub.app",
    why: "Properties, residents, violations, dues, letters, and a resident portal — built for the association side of community management.",
  },
  property: {
    name: "Property Management",
    href: process.env.NEXT_PUBLIC_PROPERTY_URL ?? "https://property.homeowner-hub.app",
    why: "Tenants, leases, rent collection, vendors, utilities, and maintenance — built for landlords and property managers running rentals.",
  },
  eviction: {
    name: "Eviction Management",
    href: process.env.NEXT_PUBLIC_EVICTION_URL ?? "https://eviction.homeowner-hub.app",
    why: "Per-jurisdiction eviction workflow with computed deadlines, generated documents, and a defensible audit trail. Currently live in Georgia (Rockdale, DeKalb).",
  },
}

type Step = 1 | 2 | 3 | "result"
type Track = "hoa" | "property" | "both"

export function Wizard() {
  const [step, setStep] = useState<Step>(1)
  const [track, setTrack] = useState<Track | null>(null)
  const [result, setResult] = useState<Product | null>(null)
  const [bothNote, setBothNote] = useState<Product | null>(null)

  function reset() {
    setStep(1)
    setTrack(null)
    setResult(null)
    setBothNote(null)
  }

  function pickQ1(answer: "hoa" | "property" | "eviction") {
    if (answer === "eviction") {
      setResult("eviction")
      setStep("result")
      return
    }
    setTrack(answer)
    setStep(2)
  }

  function pickQ2(answer: "dues" | "rent" | "both") {
    if (answer === "both") {
      setStep(3)
      return
    }
    if (answer === "dues") {
      setResult("hoa")
      setStep("result")
      return
    }
    if (answer === "rent") {
      setResult("property")
      setStep("result")
      return
    }
  }

  function pickQ3(answer: "hoa" | "property") {
    setResult(answer)
    setBothNote(answer === "hoa" ? "property" : "hoa")
    setStep("result")
  }

  return (
    <div id="wizard" className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {step !== "result" && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Step {step} of {step === 3 ? 3 : track ? 3 : 2}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {step === 1 && "What are you trying to manage?"}
            {step === 2 && "Do you collect money from residents directly?"}
            {step === 3 && "Which side is bigger this quarter?"}
          </h3>
        </>
      )}

      {step === 1 && (
        <div className="mt-6 grid gap-3">
          <WizardOption
            label="A homeowners association, condo, or master-planned community"
            onClick={() => pickQ1("hoa")}
          />
          <WizardOption
            label="Rental properties I own or operate"
            onClick={() => pickQ1("property")}
          />
          <WizardOption
            label="A specific eviction case (or several)"
            onClick={() => pickQ1("eviction")}
          />
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 grid gap-3">
          <WizardOption
            label="Yes — recurring dues from owners"
            onClick={() => pickQ2("dues")}
          />
          <WizardOption
            label="Yes — rent from tenants"
            onClick={() => pickQ2("rent")}
          />
          <WizardOption
            label="Both — I run an HOA and rentals"
            onClick={() => pickQ2("both")}
          />
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 grid gap-3">
          <WizardOption label="The HOA side" onClick={() => pickQ3("hoa")} />
          <WizardOption label="The rental side" onClick={() => pickQ3("property")} />
        </div>
      )}

      {step === "result" && result && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Recommendation
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Start with <span className="text-[var(--primary)]">{PRODUCT_INFO[result].name}</span>.
          </h3>
          <p className="mt-3 text-base text-slate-600">{PRODUCT_INFO[result].why}</p>
          {bothNote && (
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              You said you also run {bothNote === "hoa" ? "an HOA" : "rentals"}. {PRODUCT_INFO[bothNote].name} is a separate product — open an account there too when you&apos;re ready.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={PRODUCT_INFO[result].href}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Open {PRODUCT_INFO[result].name} <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Not quite right? Restart
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
        Nothing is stored. This is a routing tool, not a form.
      </p>
    </div>
  )
}

function WizardOption({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </button>
  )
}
