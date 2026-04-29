"use server"

/**
 * Stream C — Onboarding wizard server actions.
 *
 * One action per step. Each:
 *   - Validates input with Zod
 *   - Persists state to `onboarding_progress`
 *   - Audit-logs via `audit.log({...})` (skipped on Step 1 since no
 *     tenant context exists yet — Step 1 logs via withAdminClient's
 *     own `platform_audit_log` write)
 *   - Idempotent — re-running with the same input is safe
 *
 * Step 1 uses `withAdminClient` (legitimate service-role exception per
 * DECISIONS.md) because the tenant doesn't exist yet, so no RLS clamp
 * is possible. Steps 2–7 use the tenant-clamped client.
 */

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { withAdminClient } from "@/lib/admin"
import { getTenantContext } from "@/lib/tenant"
import { audit } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"
import {
  makeIsTakenWithAdmin,
  suggestUniqueSlug,
  validateSlug,
} from "@/lib/onboarding/slug"
import { buildSampleData } from "@/lib/onboarding/sample-data"

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/onboarding")
  return { supabase, user }
}

async function findActiveOnboardingTenant(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, tenant:tenants!inner(id, status, created_at)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false })
    .limit(20)

  const rows = (memberships ?? []) as Array<{ tenant_id: string }>
  if (!rows.length) return null

  // Prefer a trial tenant whose onboarding isn't done.
  for (const m of rows) {
    const tenantId = m.tenant_id
    const { data: prog } = await supabase
      .from("onboarding_progress")
      .select("tenant_id, completed_at")
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (prog && !prog.completed_at) return tenantId
  }
  // Fallback: most recent membership.
  return rows[0]?.tenant_id ?? null
}

async function setStep<T extends Record<string, unknown>>(
  tenantId: string,
  stepNum: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  data: T,
) {
  const { supabase } = await getTenantContext()
  const update: Record<string, unknown> = {
    [`step${stepNum}_done`]: true,
    [`step${stepNum}_data`]: data,
    current_step: Math.min(7, stepNum + 1),
    updated_at: new Date().toISOString(),
  }
  if (stepNum === 7) update.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from("onboarding_progress")
    .update(update)
    .eq("tenant_id", tenantId)
  if (error) throw new Error(`onboarding_progress update failed: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────
// Step 1 — Community profile (creates the tenant)
// ─────────────────────────────────────────────────────────────────────

const Step1Schema = z.object({
  name: z.string().min(2).max(120),
  legal_name: z.string().max(200).optional().nullable(),
  type: z.enum(["hoa", "coa", "master", "townhome", "condo", "sub"]),
  founded_year: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  property_count_estimate: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  address_line1: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  state: z.string().length(2).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  time_zone: z.string().min(2).max(60).default("America/New_York"),
  fiscal_year_start: z.string().regex(/^\d{2}-\d{2}$/).default("01-01"),
  currency: z.string().length(3).default("USD"),
  slug_override: z.string().optional().nullable(),
})

export type Step1Input = z.infer<typeof Step1Schema>
export type StepResult =
  | { ok: true; next: string; tenantId?: string; slug?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function submitStep1(raw: unknown): Promise<StepResult> {
  const { user } = await requireUser()

  const parsed = Step1Schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      fieldErrors[issue.path.join(".")] = issue.message
    })
    return { ok: false, error: "Invalid input", fieldErrors }
  }
  const input = parsed.data

  // Validate optional slug override (final unique slug is resolved inside withAdminClient)
  if (input.slug_override) {
    const validation = validateSlug(input.slug_override)
    if (validation) return { ok: false, error: validation, fieldErrors: { slug_override: validation } }
  }

  try {
    const result = await withAdminClient<{ tenantId: string; slug: string }>(
      {
        action: "tenant.create",
        reason: `Onboarding Step 1 — community profile submitted by ${user.email}`,
        entity: "tenants",
      },
      async (admin) => {
        // Resolve a unique slug
        const isTaken = makeIsTakenWithAdmin(admin)
        const finalSlug = await suggestUniqueSlug(
          input.slug_override ?? input.name,
          input.state ?? null,
          isTaken,
        )

        // Insert tenant
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        const { data: tenant, error: tErr } = await admin
          .from("tenants")
          .insert({
            slug: finalSlug,
            name: input.name,
            legal_name: input.legal_name,
            type: input.type,
            status: "trial",
            trial_ends_at: trialEndsAt,
            primary_owner: user.id,
          })
          .select("id, slug")
          .single()
        if (tErr || !tenant) throw new Error(`tenant insert failed: ${tErr?.message}`)

        // Make the user the owner
        const { error: mErr } = await admin
          .from("tenant_memberships")
          .insert({
            tenant_id: tenant.id,
            user_id: user.id,
            role: "owner",
            status: "active",
          })
        if (mErr) throw new Error(`membership insert failed: ${mErr.message}`)

        // Bootstrap tenant_settings (idempotent)
        await admin
          .from("tenant_settings")
          .upsert(
            {
              tenant_id: tenant.id,
              identity: {
                legal_name: input.legal_name ?? null,
                address_line1: input.address_line1 ?? null,
                city: input.city ?? null,
                state: input.state ?? null,
                zip: input.zip ?? null,
                time_zone: input.time_zone,
                fiscal_year_start: input.fiscal_year_start,
                currency: input.currency,
                founded_year: input.founded_year ?? null,
                property_count_estimate: input.property_count_estimate ?? null,
              },
            },
            { onConflict: "tenant_id" },
          )

        // Create onboarding_progress row
        await admin
          .from("onboarding_progress")
          .insert({
            tenant_id: tenant.id,
            step1_done: true,
            step1_data: { ...input, slug: tenant.slug },
            current_step: 2,
          })

        return { tenantId: tenant.id, slug: tenant.slug }
      },
    )

    revalidatePath("/onboarding")
    return { ok: true, next: "/onboarding/step-2", tenantId: result.tenantId, slug: result.slug }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Step 2 — Branding
// ─────────────────────────────────────────────────────────────────────

const Step2Schema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0F2A47"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#10B981"),
  logo_url: z.string().url().optional().nullable(),
  letterhead_url: z.string().url().optional().nullable(),
})
export type Step2Input = z.infer<typeof Step2Schema>

export async function submitStep2(raw: unknown): Promise<StepResult> {
  const tenantId = await findActiveOnboardingTenant()
  if (!tenantId) return { ok: false, error: "No active onboarding session — start at Step 1." }

  const parsed = Step2Schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((i) => (fieldErrors[i.path.join(".")] = i.message))
    return { ok: false, error: "Invalid branding input", fieldErrors }
  }
  const input = parsed.data

  const { supabase } = await getTenantContext()
  const { data: current } = await supabase
    .from("tenant_settings")
    .select("branding")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const currentBranding = (current?.branding ?? {}) as Record<string, unknown>
  const branding = {
    ...currentBranding,
    primary: input.primary_color,
    accent: input.accent_color,
    logo_url: input.logo_url ?? (currentBranding.logo_url as string | null | undefined) ?? null,
    letterhead_url:
      input.letterhead_url ?? (currentBranding.letterhead_url as string | null | undefined) ?? null,
  }

  const { error } = await supabase
    .from("tenant_settings")
    .upsert({ tenant_id: tenantId, branding }, { onConflict: "tenant_id" })
  if (error) return { ok: false, error: error.message }

  await setStep(tenantId, 2, input)
  await audit.log({
    action: "onboarding.step2.complete",
    entity: "tenant_settings",
    entityId: tenantId,
    metadata: { branding },
  })

  return { ok: true, next: "/onboarding/step-3" }
}

// ─────────────────────────────────────────────────────────────────────
// Step 3 — Properties & residents
// ─────────────────────────────────────────────────────────────────────

const Step3Schema = z.object({
  mode: z.enum(["import", "manual", "sample"]),
  imported_count: z.coerce.number().int().min(0).optional().nullable(),
  sandbox_tenant_id: z.string().uuid().optional().nullable(),
})
export type Step3Input = z.infer<typeof Step3Schema>

/**
 * "Sample data" mode creates a SEPARATE sandbox tenant with 25 fictional
 * properties and residents. Per DECISIONS.md C.1, this is a fully
 * separate tenant — not is_demo flag rows on the user's real tenant.
 */
export async function createSandboxTenant(): Promise<{ ok: boolean; tenantId?: string; slug?: string; error?: string }> {
  const { user } = await requireUser()
  const sample = buildSampleData(1)
  try {
    const result = await withAdminClient<{ tenantId: string; slug: string }>(
      {
        action: "tenant.create.sandbox",
        reason: `Demo sandbox for ${user.email}`,
      },
      async (admin) => {
        const isTaken = makeIsTakenWithAdmin(admin)
        const slug = await suggestUniqueSlug(`Demo ${user.id.slice(0, 6)}`, null, isTaken)
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        const { data: tenant, error: tErr } = await admin
          .from("tenants")
          .insert({
            slug,
            name: "Demo Community (Sandbox)",
            type: "hoa",
            status: "trial",
            trial_ends_at: trialEndsAt,
            primary_owner: user.id,
          })
          .select("id, slug")
          .single()
        if (tErr || !tenant) throw new Error(`sandbox tenant insert failed: ${tErr?.message}`)

        await admin.from("tenant_memberships").insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: "owner",
          status: "active",
        })

        // Insert sample properties + residents
        for (let idx = 0; idx < sample.properties.length; idx++) {
          const prop = sample.properties[idx]
          const { data: pRow } = await admin
            .from("properties")
            .insert({ tenant_id: tenant.id, ...prop })
            .select("id")
            .single()
          const propId = pRow?.id
          if (!propId) continue
          const residents = sample.residents.filter((r) => r.property_index === idx)
          for (const r of residents) {
            const rest: Record<string, unknown> = { ...(r as Record<string, unknown>) }
            delete rest.property_index
            await admin.from("residents").insert({
              tenant_id: tenant.id,
              property_id: propId,
              ...rest,
            })
          }
        }

        return { tenantId: tenant.id, slug: tenant.slug }
      },
    )
    return { ok: true, tenantId: result.tenantId, slug: result.slug }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function submitStep3(raw: unknown): Promise<StepResult> {
  const tenantId = await findActiveOnboardingTenant()
  if (!tenantId) return { ok: false, error: "No active onboarding session." }

  const parsed = Step3Schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Invalid Step 3 input" }

  await setStep(tenantId, 3, parsed.data)
  await audit.log({
    action: "onboarding.step3.complete",
    entity: "properties",
    metadata: parsed.data,
  })
  return { ok: true, next: "/onboarding/step-4" }
}

// ─────────────────────────────────────────────────────────────────────
// Step 4 — Governing documents (NO AI)
// ─────────────────────────────────────────────────────────────────────

const Step4Schema = z.object({
  uploaded_doc_ids: z.array(z.string().uuid()).default([]),
  skipped: z.boolean().default(false),
})
export type Step4Input = z.infer<typeof Step4Schema>

export async function submitStep4(raw: unknown): Promise<StepResult> {
  const tenantId = await findActiveOnboardingTenant()
  if (!tenantId) return { ok: false, error: "No active onboarding session." }
  const parsed = Step4Schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Invalid Step 4 input" }

  await setStep(tenantId, 4, parsed.data)
  await audit.log({
    action: "onboarding.step4.complete",
    entity: "documents",
    metadata: parsed.data,
  })
  return { ok: true, next: "/onboarding/step-5" }
}

// ─────────────────────────────────────────────────────────────────────
// Step 5 — Letter & email templates
// ─────────────────────────────────────────────────────────────────────

const Step5Schema = z.object({
  reviewed_template_keys: z.array(z.string()).default([]),
  use_defaults: z.boolean().default(true),
})

export async function submitStep5(raw: unknown): Promise<StepResult> {
  const tenantId = await findActiveOnboardingTenant()
  if (!tenantId) return { ok: false, error: "No active onboarding session." }
  const parsed = Step5Schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Invalid Step 5 input" }

  await setStep(tenantId, 5, parsed.data)
  await audit.log({
    action: "onboarding.step5.complete",
    entity: "letter_templates",
    metadata: parsed.data,
  })
  return { ok: true, next: "/onboarding/step-6" }
}

// ─────────────────────────────────────────────────────────────────────
// Step 6 — Configuration (fines, dues, leasing, vendor cats, roles)
// ─────────────────────────────────────────────────────────────────────

const Step6Schema = z.object({
  monthly_dues_cents: z.coerce.number().int().min(0).default(0),
  late_fee_cents: z.coerce.number().int().min(0).default(2500),
  grace_period_days: z.coerce.number().int().min(0).max(60).default(15),
  fine_first_offense_cents: z.coerce.number().int().min(0).default(2500),
  fine_repeat_cents: z.coerce.number().int().min(0).default(5000),
  leasing_open: z.boolean().default(true),
  leasing_cap_pct: z.coerce.number().min(0).max(100).default(15),
  leasing_min_term_months: z.coerce.number().int().min(0).default(12),
})
export type Step6Input = z.infer<typeof Step6Schema>

export async function submitStep6(raw: unknown): Promise<StepResult> {
  const tenantId = await findActiveOnboardingTenant()
  if (!tenantId) return { ok: false, error: "No active onboarding session." }
  const parsed = Step6Schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((i) => (fieldErrors[i.path.join(".")] = i.message))
    return { ok: false, error: "Invalid Step 6 input", fieldErrors }
  }
  const input = parsed.data

  const { supabase } = await getTenantContext()
  const { data: current } = await supabase
    .from("tenant_settings")
    .select("finance, rules")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const finance = {
    ...((current?.finance as Record<string, unknown>) ?? {}),
    monthly_dues_cents: input.monthly_dues_cents,
    late_fee_cents: input.late_fee_cents,
    grace_period_days: input.grace_period_days,
    fine_schedule: {
      first_offense_cents: input.fine_first_offense_cents,
      repeat_cents: input.fine_repeat_cents,
    },
  }
  const rules = {
    ...((current?.rules as Record<string, unknown>) ?? {}),
    leasing: {
      open: input.leasing_open,
      cap_pct: input.leasing_cap_pct,
      min_term_months: input.leasing_min_term_months,
    },
  }

  const { error } = await supabase
    .from("tenant_settings")
    .upsert({ tenant_id: tenantId, finance, rules }, { onConflict: "tenant_id" })
  if (error) return { ok: false, error: error.message }

  await setStep(tenantId, 6, input)
  await audit.log({
    action: "onboarding.step6.complete",
    entity: "tenant_settings",
    entityId: tenantId,
    metadata: { finance, rules },
  })
  return { ok: true, next: "/onboarding/step-7" }
}

// ─────────────────────────────────────────────────────────────────────
// Step 7 — Invite team
// ─────────────────────────────────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "board", "committee", "readonly"]),
})
const Step7Schema = z.object({
  invites: z.array(InviteSchema).max(50).default([]),
})
export type Step7Input = z.infer<typeof Step7Schema>

export async function submitStep7(raw: unknown): Promise<StepResult> {
  const tenantId = await findActiveOnboardingTenant()
  if (!tenantId) return { ok: false, error: "No active onboarding session." }
  const parsed = Step7Schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Invalid Step 7 input" }
  const input = parsed.data

  const { supabase } = await getTenantContext()
  const { data: { user } } = await supabase.auth.getUser()

  if (input.invites.length > 0) {
    const rows = input.invites.map((inv) => ({
      tenant_id: tenantId,
      email: inv.email,
      role: inv.role,
      invited_by: user?.id ?? null,
    }))
    const { error } = await supabase
      .from("tenant_invitations")
      .insert(rows)
    if (error && error.code !== "23505") {
      return { ok: false, error: `invitation insert failed: ${error.message}` }
    }
  }

  await setStep(tenantId, 7, input)
  await audit.log({
    action: "onboarding.complete",
    entity: "tenants",
    entityId: tenantId,
    metadata: { invite_count: input.invites.length },
  })

  // Look up the slug for redirect
  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .maybeSingle()

  return { ok: true, next: tenant?.slug ? `/${tenant.slug}?welcome=1` : "/" }
}
