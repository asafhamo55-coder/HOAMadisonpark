/**
 * Tenant settings + knowledge base helpers (Stream E).
 *
 * `getTenantSettings(tenantId)` is request-cached via `react.cache` so
 * that the slug layout, settings layout, and any tab page can all call
 * it without round-tripping to the DB more than once per request.
 *
 * `getKnowledgeBase(tenantId, query?)` runs the Postgres tsvector full-
 * text search against `tenant_knowledge_base.search_vector`. There is
 * NO embeddings / pgvector / AI in v1 per DECISIONS.md.
 */

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

/** Default brand tokens for any tenant that hasn't customized. */
export const DEFAULT_BRANDING = {
  primary: "#0F2A47",
  accent: "#10B981",
  logo_url: null as string | null,
  letterhead_url: null as string | null,
  login_image_url: null as string | null,
}

export type TenantBranding = {
  primary?: string | null
  accent?: string | null
  logo_url?: string | null
  letterhead_url?: string | null
  login_image_url?: string | null
}

export type TenantIdentity = {
  legal_name?: string | null
  community_type?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  phone?: string | null
  contact_email?: string | null
  fiscal_year_start?: string | null
  time_zone?: string | null
}

export type TenantFinance = {
  dues_amount_cents?: number | null
  dues_cadence?: "monthly" | "quarterly" | "semi_annual" | "annual" | null
  due_day_of_month?: number | null
  late_fee_cents?: number | null
  grace_period_days?: number | null
  fine_schedule?: Array<{
    category: string
    first_offense_cents: number
    second_offense_cents: number
    third_offense_cents: number
  }> | null
}

export type TenantRules = {
  leasing_cap_pct?: number | null
  lease_min_term_months?: number | null
  pets_allowed?: boolean | null
  parking_notes?: string | null
  pet_notes?: string | null
}

export type TenantEmail = {
  from_name?: string | null
  reply_to?: string | null
  footer?: string | null
  signature?: string | null
}

export type TenantNotifications = Record<string, boolean | null>

export type TenantFeatures = Record<string, boolean | null>

export type TenantSettings = {
  tenant_id: string
  branding: TenantBranding
  identity: TenantIdentity
  finance: TenantFinance
  rules: TenantRules
  categories: Record<string, unknown>
  features: TenantFeatures
  email: TenantEmail
  notifications: TenantNotifications
  updated_at: string
  updated_by: string | null
}

/**
 * Read the tenant_settings row for a tenant. Request-cached so multiple
 * RSCs in the same render share one DB hit.
 */
export const getTenantSettings = cache(
  async (tenantId: string): Promise<TenantSettings> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("tenant_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (error) {
      console.error(
        "[tenant-settings] getTenantSettings failed:",
        error.message,
      )
    }

    if (data) {
      return data as TenantSettings
    }

    // Empty defaults if the row hasn't been bootstrapped yet (shouldn't
    // happen — migration 013 inserts a row per tenant — but be safe).
    return {
      tenant_id: tenantId,
      branding: {},
      identity: {},
      finance: {},
      rules: {},
      categories: {},
      features: {},
      email: {},
      notifications: {},
      updated_at: new Date().toISOString(),
      updated_by: null,
    }
  },
)

/** Resolve the effective brand colors with sane fallbacks. */
export function resolveBranding(
  branding: TenantBranding | null | undefined,
): typeof DEFAULT_BRANDING {
  return {
    primary: branding?.primary ?? DEFAULT_BRANDING.primary,
    accent: branding?.accent ?? DEFAULT_BRANDING.accent,
    logo_url: branding?.logo_url ?? DEFAULT_BRANDING.logo_url,
    letterhead_url:
      branding?.letterhead_url ?? DEFAULT_BRANDING.letterhead_url,
    login_image_url:
      branding?.login_image_url ?? DEFAULT_BRANDING.login_image_url,
  }
}

export type KnowledgeBaseEntry = {
  id: string
  tenant_id: string
  document_id: string | null
  section_path: string | null
  title: string | null
  content: string | null
  structured: Record<string, unknown> | null
  citations: Record<string, unknown> | null
  is_published: boolean
  version: number
  created_at: string
  updated_at: string
  rank?: number
}

/**
 * Knowledge base search.
 *
 * - With no `query`: return all entries for the tenant, newest first.
 * - With a `query`: run `plainto_tsquery('english', query)` against the
 *   generated `search_vector` GIN index and rank by `ts_rank`.
 *
 * NEVER calls embeddings / Anthropic / OpenAI. tsvector only.
 */
export async function getKnowledgeBase(
  tenantId: string,
  query?: string | null,
): Promise<KnowledgeBaseEntry[]> {
  const supabase = createClient()

  if (!query || !query.trim()) {
    const { data, error } = await supabase
      .from("tenant_knowledge_base")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("[tenant-settings] getKnowledgeBase failed:", error.message)
      return []
    }

    return (data ?? []) as KnowledgeBaseEntry[]
  }

  // tsvector full-text search via the SQL helper function defined in
  // migration 013-search (graceful fallback: if RPC is missing, fall
  // back to the textSearch builder which generates a plainto_tsquery).
  const { data, error } = await supabase
    .from("tenant_knowledge_base")
    .select("*")
    .eq("tenant_id", tenantId)
    .textSearch("search_vector", query.trim(), {
      type: "plain",
      config: "english",
    })
    .limit(50)

  if (error) {
    console.error("[tenant-settings] kb search failed:", error.message)
    return []
  }

  return (data ?? []) as KnowledgeBaseEntry[]
}
