"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { captureServer } from "@/lib/posthog-server"

/**
 * Stream B owns ONLY the auth.users creation.
 *
 * The tenant row, tenant_memberships row, and the rest of the onboarding
 * payload (community basics) are all created by Stream C inside
 * `/onboarding`. We pass the community-name + plan + community-type +
 * state + property-count through the Supabase Auth user_metadata so
 * onboarding can pre-fill the wizard.
 *
 * Per DECISIONS.md, plan choice does NOT create a Stripe subscription —
 * the trial requires no card. Stream D adds the upgrade flow later.
 */

const PLAN_VALUES = ["trial", "starter", "standard", "pro"] as const
const COMMUNITY_TYPES = ["hoa", "coa", "master", "townhome", "other"] as const
const HEARD_OPTIONS = [
  "search",
  "referral",
  "social",
  "industry",
  "other",
] as const

const SignupSchema = z.object({
  plan: z.enum(PLAN_VALUES),
  fullName: z.string().min(2, "Please enter your full name").max(120),
  email: z.string().email("Enter a valid email").max(254),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(72, "Keep it under 72 characters"),
  acceptedTerms: z.literal("on", {
    message: "Please accept the terms to continue",
  }),
  communityName: z.string().min(2, "Community name is required").max(120),
  communityType: z.enum(COMMUNITY_TYPES),
  state: z.string().min(2, "State is required").max(2),
  propertyCount: z.coerce.number().int().min(1).max(10000),
  heardFrom: z.enum(HEARD_OPTIONS).optional(),
})

export type SignupResult = {
  ok: boolean
  fieldErrors?: Record<string, string[]>
  formError?: string
}

export async function signUp(formData: FormData): Promise<SignupResult> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = SignupSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const data = parsed.data
  const supabase = createClient()

  const headersList = headers()
  const origin =
    headersList.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://hoaprohub.app"

  const { error, data: signUpData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // Onboarding will read these on the first /onboarding load.
      data: {
        full_name: data.fullName,
        signup_plan: data.plan,
        community_name: data.communityName,
        community_type: data.communityType,
        community_state: data.state.toUpperCase(),
        community_property_count: data.propertyCount,
        heard_from: data.heardFrom ?? null,
      },
      emailRedirectTo: `${origin}/onboarding`,
    },
  })

  if (error) {
    return { ok: false, formError: error.message }
  }

  // Fire-and-forget analytics — never blocks the response.
  await captureServer("signup.created", signUpData?.user?.id ?? null, {
    plan: data.plan,
    community_type: data.communityType,
    state: data.state.toUpperCase(),
    property_count: data.propertyCount,
    heard_from: data.heardFrom ?? null,
  })

  return { ok: true }
}
