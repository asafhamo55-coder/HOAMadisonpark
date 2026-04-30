/**
 * Onboarding progress reader/writer.
 *
 * The onboarding wizard runs OUTSIDE a tenant route (no `/[slug]/...`),
 * so middleware does not pin a tenant id. The current user might:
 *
 *   - Have NO tenant yet (Step 1 will create it).
 *   - Have exactly one tenant in `trial` status that is mid-onboarding —
 *     resume that one.
 *   - Have multiple tenants, some onboarding, some not — find the most
 *     recently-created `trial` tenant whose progress row is incomplete.
 *
 * The reader is read-only and uses the user's anon-key Supabase client
 * (RLS enforced via `tenant_memberships`). Step actions that need to
 * write to the progress table must do so through `withAdminClient` so
 * we can write before `set_request_tenant` is callable, OR through the
 * tenant-clamped client once the tenant exists.
 */

import { createClient } from "@/lib/supabase/server"

export type OnboardingProgress = {
  tenant_id: string
  current_step: number
  step1_done: boolean
  step1_data: Record<string, unknown> | null
  step2_done: boolean
  step2_data: Record<string, unknown> | null
  step3_done: boolean
  step3_data: Record<string, unknown> | null
  step4_done: boolean
  step4_data: Record<string, unknown> | null
  step5_done: boolean
  step5_data: Record<string, unknown> | null
  step6_done: boolean
  step6_data: Record<string, unknown> | null
  step7_done: boolean
  step7_data: Record<string, unknown> | null
  completed_at: string | null
  tenant: {
    id: string
    slug: string
    name: string
    status: string
  }
}

export type ResumeState =
  | { kind: "none" } // user has no in-flight tenant — show Step 1 fresh
  | { kind: "in_progress"; progress: OnboardingProgress }
  | { kind: "complete"; progress: OnboardingProgress }

/**
 * Locate the user's in-flight (or completed) onboarding draft, if any.
 *
 * Strategy:
 *   1. Find all tenant memberships for the user where the tenant is
 *      not soft-deleted.
 *   2. For each, look up the onboarding_progress row.
 *   3. Prefer the most recently updated incomplete one. Fall back to
 *      the most recently completed one for a "Welcome back" prompt.
 */
export async function getResumeState(): Promise<ResumeState> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { kind: "none" }

  // We expect tenant_memberships to be readable via the standard RLS
  // policy (user can read their own memberships). The downstream join
  // to `tenants` and `onboarding_progress` requires the tenant to be
  // pinned via set_request_tenant — but for an onboarding lookup we
  // want a list across all of the user's tenants. The simplest reliable
  // path is to read membership rows first, then fetch tenants + progress
  // one at a time with `set_request_tenant` per tenant.

  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role, status, joined_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false })

  if (!memberships || memberships.length === 0) {
    return { kind: "none" }
  }

  let bestInProgress: OnboardingProgress | null = null
  let mostRecentComplete: OnboardingProgress | null = null

  for (const m of memberships) {
    // Pin tenant for this lookup so RLS lets us read tenants + progress.
    const { error: rpcErr } = await supabase.rpc("set_request_tenant", {
      t: m.tenant_id,
    })
    if (rpcErr) continue // skip — likely suspended membership

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, name, status, deleted_at")
      .eq("id", m.tenant_id)
      .maybeSingle()
    if (!tenant || tenant.deleted_at) continue

    const { data: progress } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("tenant_id", m.tenant_id)
      .maybeSingle()
    if (!progress) continue

    const merged: OnboardingProgress = {
      ...(progress as Omit<OnboardingProgress, "tenant">),
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
      },
    }

    if (merged.completed_at) {
      if (!mostRecentComplete) mostRecentComplete = merged
    } else {
      if (!bestInProgress) bestInProgress = merged
    }
  }

  if (bestInProgress) return { kind: "in_progress", progress: bestInProgress }
  if (mostRecentComplete)
    return { kind: "complete", progress: mostRecentComplete }
  return { kind: "none" }
}

/**
 * Compute a 0-100 percentage of completed steps.
 */
export function progressPercent(p: OnboardingProgress | null): number {
  if (!p) return 0
  const flags = [
    p.step1_done,
    p.step2_done,
    p.step3_done,
    p.step4_done,
    p.step5_done,
    p.step6_done,
    p.step7_done,
  ]
  const done = flags.filter(Boolean).length
  return Math.round((done / flags.length) * 100)
}

export const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Community profile", subtitle: "Name, type, address, fiscal year" },
  2: { title: "Branding", subtitle: "Logo, colors, letterhead" },
  3: {
    title: "Properties & residents",
    subtitle: "Bulk import, manual entry, or sample data",
  },
  4: {
    title: "Governing documents",
    subtitle: "Upload CC&Rs, bylaws, rules — text indexed for search",
  },
  5: {
    title: "Letter & email templates",
    subtitle: "Pre-seeded templates you can edit",
  },
  6: { title: "Configuration", subtitle: "Fines, dues, leasing rules, categories" },
  7: { title: "Invite team", subtitle: "Board, committee, vendor logins" },
}
