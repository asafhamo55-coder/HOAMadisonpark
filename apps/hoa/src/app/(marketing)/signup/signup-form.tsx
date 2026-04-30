"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PLANS } from "@/lib/brand"
import { cn } from "@/lib/utils"

import { signUp } from "./actions"

type Plan = (typeof PLANS)[number]["slug"]

const COMMUNITY_TYPES = [
  { value: "hoa", label: "HOA" },
  { value: "coa", label: "Condo association" },
  { value: "master", label: "Master-planned community" },
  { value: "townhome", label: "Townhome association" },
  { value: "other", label: "Other" },
] as const

const HEARD_OPTIONS = [
  { value: "search", label: "Google / search" },
  { value: "referral", label: "Word of mouth" },
  { value: "social", label: "Social media" },
  { value: "industry", label: "Industry publication" },
  { value: "other", label: "Other" },
] as const

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

export function SignupForm({ initialPlan }: { initialPlan: Plan }) {
  const [step, setStep] = useState<1 | 2 | 3>(initialPlan === "trial" ? 2 : 1)
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >()
  const [formError, setFormError] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  // Keep field values controlled across steps so they persist when the user
  // pages back/forward without reloading.
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    acceptedTerms: false,
    communityName: "",
    communityType: "hoa",
    state: "",
    propertyCount: "",
    heardFrom: "",
  })

  function field<K extends keyof typeof values>(name: K) {
    return {
      value: values[name] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setValues((v) => ({ ...v, [name]: e.target.value })),
    }
  }

  function next() {
    setFieldErrors(undefined)
    setFormError(undefined)

    // Step-2 client-side gate so users don't reach Step 3 without
    // accepting the ToS or filling required account fields.
    if (step === 2) {
      const errs: Record<string, string[]> = {}
      if (!values.fullName.trim()) errs.fullName = ["Full name is required"]
      if (!values.email.trim()) errs.email = ["Email is required"]
      if (!values.password || values.password.length < 10) {
        errs.password = ["Use at least 10 characters"]
      }
      if (!values.acceptedTerms) {
        errs.acceptedTerms = ["Please accept the Terms and Privacy Policy to continue"]
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        return
      }
    }

    setStep((s) => (Math.min(3, s + 1) as 1 | 2 | 3))
  }
  function prev() {
    setFieldErrors(undefined)
    setFormError(undefined)
    setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Build FormData from the controlled `values` state — DOM-only FormData
    // misses step-2 fields when the user is on step 3 (those inputs are
    // unmounted by the conditional render).
    const fd = new FormData()
    fd.set("plan", plan)
    fd.set("fullName", values.fullName)
    fd.set("email", values.email)
    fd.set("password", values.password)
    if (values.acceptedTerms) fd.set("acceptedTerms", "on")
    fd.set("communityName", values.communityName)
    fd.set("communityType", values.communityType)
    fd.set("state", values.state)
    fd.set("propertyCount", values.propertyCount)
    if (values.heardFrom) fd.set("heardFrom", values.heardFrom)

    startTransition(async () => {
      const result = await signUp(fd)
      if (!result.ok) {
        setFieldErrors(result.fieldErrors)
        setFormError(result.formError)
        // Snap back to whichever step has the error.
        if (result.fieldErrors?.fullName || result.fieldErrors?.email || result.fieldErrors?.password || result.fieldErrors?.acceptedTerms) {
          setStep(2)
        } else if (result.fieldErrors) {
          setStep(3)
        }
        return
      }
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl font-medium text-slate-900">
          Check your email
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          We sent a confirmation link to <strong>{values.email}</strong>.
          Click it to verify your address and finish setting up your
          community on the next screen.
        </p>
        <p className="mt-6 text-xs text-slate-500">
          Didn&apos;t get the email? Check spam, or{" "}
          <button
            type="button"
            className="text-emerald-700 underline-offset-2 hover:underline"
            onClick={() => setSubmitted(false)}
          >
            try a different address
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <form className="mx-auto max-w-2xl" onSubmit={onSubmit} noValidate>
      <ol className="mb-10 grid grid-cols-3 gap-2 text-xs font-medium">
        {(["Plan", "Account", "Community"] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3
          const active = step === n
          const done = step > n
          return (
            <li
              key={label}
              className={cn(
                "rounded-full border px-3 py-1.5 text-center",
                active && "border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white",
                done && "border-emerald-200 bg-emerald-50 text-emerald-800",
                !active && !done && "border-slate-200 bg-white text-slate-500",
              )}
            >
              {done && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}
              {n}. {label}
            </li>
          )
        })}
      </ol>

      {step === 1 && (
        <fieldset>
          <legend className="font-display text-2xl font-medium text-slate-900">
            Pick a starting plan
          </legend>
          <p className="mt-2 text-sm text-slate-600">
            Trial is free for 14 days, no card required. You can change
            plans any time.
          </p>
          <div className="mt-6 grid gap-3">
            {PLANS.map((p) => (
              <label
                key={p.slug}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4",
                  plan === p.slug
                    ? "border-[var(--tenant-primary)] ring-2 ring-[var(--tenant-primary)]/15"
                    : "border-slate-200",
                )}
              >
                <input
                  type="radio"
                  name="plan-choice"
                  className="mt-1 accent-emerald-600"
                  checked={plan === p.slug}
                  onChange={() => setPlan(p.slug as Plan)}
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-semibold text-slate-900">
                      {p.name}
                    </span>
                    <span className="text-sm text-slate-700">
                      {p.monthly === 0 ? "Free for 14 days" : `$${p.monthly}/mo`}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button
              type="button"
              onClick={next}
              className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset>
          <legend className="font-display text-2xl font-medium text-slate-900">
            Create your admin account
          </legend>
          <p className="mt-2 text-sm text-slate-600">
            This becomes the owner account for your community. You can
            invite more admins after onboarding.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                {...field("fullName")}
              />
              {fieldErrors?.fullName?.[0] && (
                <p className="text-xs text-red-600">{fieldErrors.fullName[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                {...field("email")}
              />
              {fieldErrors?.email?.[0] && (
                <p className="text-xs text-red-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                {...field("password")}
              />
              <p className="text-xs text-slate-500">
                Minimum 10 characters. We hash with bcrypt; even our staff
                can&apos;t see it.
              </p>
              {fieldErrors?.password?.[0] && (
                <p className="text-xs text-red-600">{fieldErrors.password[0]}</p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 accent-emerald-600"
                checked={values.acceptedTerms}
                onChange={(e) =>
                  setValues((v) => ({ ...v, acceptedTerms: e.target.checked }))
                }
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/legal/terms"
                  className="text-emerald-700 underline underline-offset-2"
                  target="_blank"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/privacy"
                  className="text-emerald-700 underline underline-offset-2"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {fieldErrors?.acceptedTerms?.[0] && (
              <p className="text-xs text-red-600">
                {fieldErrors.acceptedTerms[0]}
              </p>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={prev}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              type="button"
              onClick={next}
              className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset>
          <legend className="font-display text-2xl font-medium text-slate-900">
            Tell us about your community
          </legend>
          <p className="mt-2 text-sm text-slate-600">
            Just enough to set up your tenant. You can edit everything in
            onboarding.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="communityName">Community name</Label>
              <Input
                id="communityName"
                name="communityName"
                placeholder="e.g. Madison Park HOA"
                required
                {...field("communityName")}
              />
              {fieldErrors?.communityName?.[0] && (
                <p className="text-xs text-red-600">
                  {fieldErrors.communityName[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="communityType">Type</Label>
              <select
                id="communityType"
                name="communityType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...field("communityType")}
              >
                {COMMUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                name="state"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...field("state")}
              >
                <option value="">Choose a state…</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {fieldErrors?.state?.[0] && (
                <p className="text-xs text-red-600">{fieldErrors.state[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="propertyCount">Approximate properties</Label>
              <Input
                id="propertyCount"
                name="propertyCount"
                type="number"
                min={1}
                max={10000}
                placeholder="e.g. 250"
                required
                {...field("propertyCount")}
              />
              {fieldErrors?.propertyCount?.[0] && (
                <p className="text-xs text-red-600">
                  {fieldErrors.propertyCount[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="heardFrom">How did you hear about us?</Label>
              <select
                id="heardFrom"
                name="heardFrom"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...field("heardFrom")}
              >
                <option value="">Optional</option>
                {HEARD_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={prev} disabled={pending}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </div>
        </fieldset>
      )}

      <p className="mt-10 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
        .
      </p>
    </form>
  )
}
