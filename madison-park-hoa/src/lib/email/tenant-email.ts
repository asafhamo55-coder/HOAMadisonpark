/**
 * Tenant-aware email branding helpers.
 *
 * Every email send (transactional, broadcast, letter) must look up the
 * active tenant's branding/email settings and pass them into the email
 * template. This module centralizes that lookup so the rest of the
 * codebase doesn't have to know the schema details.
 *
 * Stream E owns the `tenant_settings` table; Stream G consumes it. The
 * helper degrades gracefully when `tenant_settings` doesn't have a row
 * for the current tenant (early dev / fresh install) — it falls back to
 * the tenant's `name` from `tenants` and the env-default sender.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

/** Branding used in email layouts. */
export type TenantEmailBranding = {
  primary_color: string
  secondary_color: string
  logo_url: string | null
  letterhead_url: string | null
}

/** Information passed to email templates so they can render tenant-specific
 * chrome. Always non-null after `loadTenantEmailContext` resolves. */
export type TenantEmailContext = {
  tenantId: string
  /** Display name shown in headers & subjects. */
  name: string
  /** Legal name shown in footers ("Madison Park Homeowners Association"). */
  legalName: string | null
  /** Mailing address printed in the footer (multi-line, may include city/state). */
  address: string | null
  /** Public phone number shown in the footer, optional. */
  phone: string | null
  /** Public marketing website URL, optional. */
  website: string | null
  /** "from" header for outbound mail, e.g. "Madison Park HOA <noreply@...>". */
  fromAddress: string
  /** Reply-to header for resident replies. */
  replyTo: string | null
  /** Optional HTML signature appended to letters. */
  signatureHtml: string | null
  branding: TenantEmailBranding
}

const DEFAULT_BRANDING: TenantEmailBranding = {
  primary_color: "#1e3a5f",
  secondary_color: "#94a3b8",
  logo_url: null,
  letterhead_url: null,
}

/**
 * Per Asaf's decision in DECISIONS.md: existing Madison Park keeps
 * `noreply@madisonparkhoa.com` as the sender domain. New tenants
 * default to `noreply@hoaprohub.app` once DKIM/SPF/DMARC are verified.
 * Until then, tenants without a custom email_from fall back to
 * `onboarding@resend.dev` for local/dev use.
 */
export function getEmailFromAddress(ctx: TenantEmailContext): string {
  // If the tenant has its own email_from configured, use it.
  if (ctx.fromAddress && ctx.fromAddress.includes("@")) {
    return ctx.fromAddress
  }
  // Otherwise apply the global env defaults the legacy app already uses.
  return (
    process.env.EMAIL_FROM ||
    process.env.HOA_FROM_EMAIL ||
    `${ctx.name} <onboarding@resend.dev>`
  )
}

/**
 * Load the tenant email context for a given tenant id.
 *
 * Reads `tenants` (always exists) plus `tenant_settings` (Stream E —
 * may not have a row yet during early development). RLS clamps the
 * lookup to the active tenant so we don't need to add explicit filters.
 */
export async function loadTenantEmailContext(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<TenantEmailContext> {
  // Tenant base record.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, legal_name")
    .eq("id", tenantId)
    .maybeSingle()

  // Stream-E settings. May be absent.
  const { data: settings } = await supabase
    .from("tenant_settings")
    .select(
      "branding, contact_address, contact_phone, contact_website, email_from, email_reply_to, email_signature_html",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const branding: TenantEmailBranding = {
    ...DEFAULT_BRANDING,
    ...((settings?.branding as Partial<TenantEmailBranding>) ?? {}),
  }

  const name = tenant?.name ?? "Your HOA"
  const legalName = tenant?.legal_name ?? null
  const fromAddress =
    (settings?.email_from as string | null) ??
    process.env.EMAIL_FROM ??
    process.env.HOA_FROM_EMAIL ??
    `${name} <onboarding@resend.dev>`

  return {
    tenantId,
    name,
    legalName,
    address: (settings?.contact_address as string | null) ?? null,
    phone: (settings?.contact_phone as string | null) ?? null,
    website: (settings?.contact_website as string | null) ?? null,
    fromAddress,
    replyTo: (settings?.email_reply_to as string | null) ?? null,
    signatureHtml: (settings?.email_signature_html as string | null) ?? null,
    branding,
  }
}
