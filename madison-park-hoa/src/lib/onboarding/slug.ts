/**
 * Slug generation + collision resolution for tenant onboarding.
 *
 * Per DECISIONS.md:
 *   - Madison Park slug = "madison-park"
 *   - Collisions across states get suffixed with the state code
 *     (e.g. "sunset-ridge-ga"). If still taken, append "-2", "-3", ...
 *   - The user can edit the suggested slug.
 *
 * The DB enforces `tenants.slug unique` so a race between two onboardings
 * can still fail at insert time — the caller should catch the unique
 * violation and re-suggest.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "and",
  "at",
  "in",
  "on",
  "for",
  "association",
  "hoa",
  "homeowners",
  "owners",
  "community",
])

/**
 * Convert a free-form community name into a URL-safe base slug.
 * - Lowercases
 * - Strips diacritics
 * - Drops common stopwords ("the", "homeowners", ...)
 * - Replaces non-alphanumerics with hyphens
 * - Collapses runs of hyphens, trims edges
 * - Truncates to 48 chars to leave room for state/numeric suffix
 */
export function baseSlug(input: string): string {
  const stripped = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()

  const tokens = stripped
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))

  // If the user typed something weird that yields no tokens, fall back
  // to a deterministic slug so we don't silently produce "".
  const candidate = tokens.length > 0 ? tokens.join("-") : "community"

  return candidate.replace(/^-+|-+$/g, "").slice(0, 48)
}

/**
 * Suggest a slug, falling back through:
 *   1. <base>
 *   2. <base>-<state>           (state lowercased, e.g. "sunset-ridge-ga")
 *   3. <base>-2, <base>-3, …    (capped at -99)
 *   4. <base>-<state>-2, …      (final fallback)
 *
 * `state` may be null/empty when the user has not filled the state field
 * yet — in that case we skip the state-suffix step.
 *
 * Returns the first slug that is NOT taken according to the supplied
 * `isTaken` predicate.
 */
export async function suggestUniqueSlug(
  name: string,
  state: string | null | undefined,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = baseSlug(name)
  const stateSuffix = (state ?? "").trim().toLowerCase().slice(0, 2)

  // 1. base
  if (!(await isTaken(base))) return base

  // 2. base-state
  if (stateSuffix && /^[a-z]{2}$/.test(stateSuffix)) {
    const withState = `${base}-${stateSuffix}`
    if (!(await isTaken(withState))) return withState
  }

  // 3. base-N (2..99)
  for (let n = 2; n <= 99; n++) {
    const numbered = `${base}-${n}`
    if (!(await isTaken(numbered))) return numbered
  }

  // 4. base-state-N
  if (stateSuffix) {
    for (let n = 2; n <= 99; n++) {
      const fallback = `${base}-${stateSuffix}-${n}`
      if (!(await isTaken(fallback))) return fallback
    }
  }

  // Ultimate fallback — extremely unlikely. Append a short random id.
  const random = Math.random().toString(36).slice(2, 8)
  return `${base}-${random}`
}

/**
 * Convenience: build an `isTaken` predicate backed by a Supabase admin
 * client. Used during Step 1 of onboarding when no tenant exists yet
 * and so the standard tenant-clamped client cannot read tenants.slug.
 */
export function makeIsTakenWithAdmin(admin: SupabaseClient) {
  return async function isTaken(slug: string): Promise<boolean> {
    const { data, error } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (error && error.code !== "PGRST116") {
      // Real error — fail closed by treating as taken so the caller picks
      // a different slug rather than silently colliding.
      return true
    }
    return data !== null
  }
}

/**
 * Validate a user-edited slug. Returns null on success, or an error
 * message string. Does NOT check uniqueness — that's the caller's job.
 */
export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug is required."
  if (slug.length < 2) return "Slug must be at least 2 characters."
  if (slug.length > 64) return "Slug must be 64 characters or fewer."
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return "Use lowercase letters, digits, and hyphens only. Cannot start or end with a hyphen."
  }
  if (slug.includes("--")) return "Slug cannot contain consecutive hyphens."
  // Reserved first-segments (must mirror middleware.ts).
  const reserved = new Set([
    "_next",
    "api",
    "favicon.ico",
    "fonts",
    "static",
    "public",
    "dashboard",
    "portal",
    "login",
    "reset-password",
    "auth",
    "select-tenant",
    "no-access",
    "accept-invite",
    "suspended",
    "404",
    "platform",
    "onboarding",
    "pricing",
    "signup",
    "demo",
    "about",
    "legal",
  ])
  if (reserved.has(slug)) return "That slug is reserved. Try another."
  return null
}
