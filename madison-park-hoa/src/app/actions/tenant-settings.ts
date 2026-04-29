"use server"

/**
 * Stream E server actions — tenant_settings, knowledge_base,
 * letter_templates, violation_categories.
 *
 * Every state-changing action:
 *
 *   1. Calls `getTenantContext()` which both authorizes the user as
 *      a member of the tenant AND pins the tenant id into the
 *      Postgres session var so RLS clamps writes to this tenant.
 *   2. Verifies the role is allowed for this action.
 *   3. Persists the change.
 *   4. Writes a row to `audit_log` via `audit.log({...})` so every
 *      settings change leaves a paper trail.
 *   5. Calls `revalidatePath` on the relevant settings tab.
 *
 * No service-role / admin client is used. Everything goes through the
 * tenant-scoped supabase client returned by `getTenantContext()`.
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { audit } from "@/lib/audit"
import { getTenantContext, type TenantRole } from "@/lib/tenant"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data }
}
function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

const STAFF_ROLES: TenantRole[] = ["owner", "admin", "board", "committee"]
const ADMIN_ROLES: TenantRole[] = ["owner", "admin"]
const OWNER_ROLES: TenantRole[] = ["owner"]

async function requireRole(allowed: TenantRole[]) {
  const ctx = await getTenantContext()
  if (!allowed.includes(ctx.role)) {
    throw new Error(`Forbidden — requires one of ${allowed.join(", ")}`)
  }
  return ctx
}

/* ──────────────────────────────────────────────────────────────────
 * 1. tenant_settings — one action per JSONB bucket.
 *    Each one merges shallow keys so updating "branding.primary"
 *    doesn't blow away "branding.logo_url".
 * ────────────────────────────────────────────────────────────────── */

async function patchTenantSettings(
  bucket:
    | "branding"
    | "identity"
    | "finance"
    | "rules"
    | "categories"
    | "features"
    | "email"
    | "notifications",
  patch: Record<string, unknown>,
  auditAction: string,
) {
  const ctx = await requireRole(STAFF_ROLES)

  // Read current bucket so we shallow-merge.
  const { data: current, error: readErr } = await ctx.supabase
    .from("tenant_settings")
    .select(`${bucket}`)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle()

  if (readErr) return fail(readErr.message)

  const existing =
    ((current as Record<string, unknown> | null)?.[bucket] as Record<
      string,
      unknown
    > | null) ?? {}
  const merged = { ...existing, ...patch }

  const { error: writeErr } = await ctx.supabase
    .from("tenant_settings")
    .update({
      [bucket]: merged,
      updated_by: ctx.userId,
    })
    .eq("tenant_id", ctx.tenantId)

  if (writeErr) return fail(writeErr.message)

  await audit.log({
    action: auditAction,
    entity: "tenant_settings",
    entityId: ctx.tenantId,
    metadata: { bucket, patch, before: existing },
  })

  revalidatePath(`/${ctx.tenantSlug}/settings`, "layout")
  return ok()
}

/* General — identity */

const IdentitySchema = z.object({
  legal_name: z.string().max(200).optional().nullable(),
  community_type: z.string().max(80).optional().nullable(),
  address_line1: z.string().max(200).optional().nullable(),
  address_line2: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  state: z.string().max(60).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal("")),
  fiscal_year_start: z.string().max(20).optional().nullable(),
  time_zone: z.string().max(80).optional().nullable(),
})

export async function saveIdentity(
  input: z.infer<typeof IdentitySchema>,
): Promise<ActionResult> {
  const parsed = IdentitySchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  return patchTenantSettings("identity", parsed.data, "settings.identity.update")
}

/* Branding */

const HEX = /^#[0-9a-fA-F]{6}$/
const BrandingSchema = z.object({
  primary: z.string().regex(HEX, "Use a #RRGGBB hex color").optional().nullable(),
  accent: z.string().regex(HEX, "Use a #RRGGBB hex color").optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal("")),
  letterhead_url: z.string().url().optional().nullable().or(z.literal("")),
  login_image_url: z.string().url().optional().nullable().or(z.literal("")),
})

export async function saveBranding(
  input: z.infer<typeof BrandingSchema>,
): Promise<ActionResult> {
  const parsed = BrandingSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  return patchTenantSettings("branding", parsed.data, "settings.branding.update")
}

/* Email */

const EmailSchema = z.object({
  from_name: z.string().max(120).optional().nullable(),
  reply_to: z.string().email().optional().nullable().or(z.literal("")),
  footer: z.string().max(2000).optional().nullable(),
  signature: z.string().max(2000).optional().nullable(),
})

export async function saveEmailSettings(
  input: z.infer<typeof EmailSchema>,
): Promise<ActionResult> {
  const parsed = EmailSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  return patchTenantSettings("email", parsed.data, "settings.email.update")
}

/* Finance — base dues + late fee + cadence */

const FinanceSchema = z.object({
  dues_amount_cents: z.number().int().min(0).max(10_000_000).optional().nullable(),
  dues_cadence: z
    .enum(["monthly", "quarterly", "semi_annual", "annual"])
    .optional()
    .nullable(),
  due_day_of_month: z.number().int().min(1).max(28).optional().nullable(),
  late_fee_cents: z.number().int().min(0).max(10_000_000).optional().nullable(),
  grace_period_days: z.number().int().min(0).max(365).optional().nullable(),
})

export async function saveFinance(
  input: z.infer<typeof FinanceSchema>,
): Promise<ActionResult> {
  const parsed = FinanceSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  return patchTenantSettings("finance", parsed.data, "settings.finance.update")
}

/* Fine schedule (lives inside finance.fine_schedule[]) */

const FineRowSchema = z.object({
  category: z.string().min(1).max(120),
  first_offense_cents: z.number().int().min(0),
  second_offense_cents: z.number().int().min(0),
  third_offense_cents: z.number().int().min(0),
})

export async function saveFineSchedule(
  rows: z.infer<typeof FineRowSchema>[],
): Promise<ActionResult> {
  const parsed = z.array(FineRowSchema).safeParse(rows)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  return patchTenantSettings(
    "finance",
    { fine_schedule: parsed.data },
    "settings.fine_schedule.update",
  )
}

/* Rules & restrictions */

const RulesSchema = z.object({
  leasing_cap_pct: z.number().min(0).max(100).optional().nullable(),
  lease_min_term_months: z.number().int().min(0).max(120).optional().nullable(),
  pets_allowed: z.boolean().optional().nullable(),
  parking_notes: z.string().max(4000).optional().nullable(),
  pet_notes: z.string().max(4000).optional().nullable(),
})

export async function saveRules(
  input: z.infer<typeof RulesSchema>,
): Promise<ActionResult> {
  const parsed = RulesSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  return patchTenantSettings("rules", parsed.data, "settings.rules.update")
}

/* Notifications */

const NotificationsSchema = z.record(z.string(), z.boolean())

export async function saveNotifications(
  input: z.infer<typeof NotificationsSchema>,
): Promise<ActionResult> {
  const parsed = NotificationsSchema.safeParse(input)
  if (!parsed.success) return fail("Invalid input")
  return patchTenantSettings(
    "notifications",
    parsed.data,
    "settings.notifications.update",
  )
}

/* ──────────────────────────────────────────────────────────────────
 * 2. violation_categories — CRUD
 * ────────────────────────────────────────────────────────────────── */

const ViolationCategorySchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/),
  description: z.string().max(2000).optional().nullable(),
  default_fine_cents: z.number().int().min(0),
  first_offense_cents: z.number().int().min(0).optional().nullable(),
  second_offense_cents: z.number().int().min(0).optional().nullable(),
  third_offense_cents: z.number().int().min(0).optional().nullable(),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
})

export async function upsertViolationCategory(
  input: z.infer<typeof ViolationCategorySchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ViolationCategorySchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const ctx = await requireRole(STAFF_ROLES)

  const payload = { ...parsed.data, tenant_id: ctx.tenantId }
  if (!payload.id) delete (payload as Record<string, unknown>).id

  const { data, error } = await ctx.supabase
    .from("violation_categories")
    .upsert(payload, { onConflict: "tenant_id,slug" })
    .select("id")
    .single()

  if (error) return fail(error.message)

  await audit.log({
    action: payload.id
      ? "violation_category.update"
      : "violation_category.create",
    entity: "violation_categories",
    entityId: data.id,
    metadata: { name: parsed.data.name, slug: parsed.data.slug },
  })

  revalidatePath(`/${ctx.tenantSlug}/settings/violation-categories`)
  return ok({ id: data.id })
}

export async function deleteViolationCategory(
  id: string,
): Promise<ActionResult> {
  const ctx = await requireRole(ADMIN_ROLES)
  const { error } = await ctx.supabase
    .from("violation_categories")
    .delete()
    .eq("id", id)
  if (error) return fail(error.message)

  await audit.log({
    action: "violation_category.delete",
    entity: "violation_categories",
    entityId: id,
  })

  revalidatePath(`/${ctx.tenantSlug}/settings/violation-categories`)
  return ok()
}

/* ──────────────────────────────────────────────────────────────────
 * 3. letter_templates — save body / variables
 *    The DB trigger `letter_templates_snapshot` automatically inserts
 *    a `letter_template_versions` row on every save, so we don't have
 *    to write one manually here.
 * ────────────────────────────────────────────────────────────────── */

const LetterTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  subject: z.string().max(500).optional().nullable(),
  body_html: z.string().max(200_000),
  variables: z.array(z.string()).default([]),
})

export async function saveLetterTemplate(
  input: z.infer<typeof LetterTemplateSchema>,
): Promise<ActionResult> {
  const parsed = LetterTemplateSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const ctx = await requireRole(STAFF_ROLES)

  const { error } = await ctx.supabase
    .from("letter_templates")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      subject: parsed.data.subject ?? null,
      body_html: parsed.data.body_html,
      variables: parsed.data.variables,
      updated_by: ctx.userId,
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.tenantId)

  if (error) return fail(error.message)

  await audit.log({
    action: "letter_template.update",
    entity: "letter_templates",
    entityId: parsed.data.id,
    metadata: { name: parsed.data.name },
  })

  revalidatePath(`/${ctx.tenantSlug}/settings/letter-templates`)
  revalidatePath(`/${ctx.tenantSlug}/settings/letter-templates/${parsed.data.id}/edit`)
  return ok()
}

/* ──────────────────────────────────────────────────────────────────
 * 4. tenant_knowledge_base — manual CRUD only.
 *    NO AI extraction button. Admin types content + section path.
 * ────────────────────────────────────────────────────────────────── */

const KnowledgeBaseSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  section_path: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50_000),
  citations: z.string().max(2000).optional().nullable(),
  is_published: z.boolean().default(false),
})

export async function upsertKnowledgeBaseEntry(
  input: z.infer<typeof KnowledgeBaseSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = KnowledgeBaseSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const ctx = await requireRole(STAFF_ROLES)

  const payload: Record<string, unknown> = {
    tenant_id: ctx.tenantId,
    section_path: parsed.data.section_path,
    title: parsed.data.title,
    content: parsed.data.content,
    citations: parsed.data.citations ? { note: parsed.data.citations } : null,
    is_published: parsed.data.is_published,
  }

  if (parsed.data.id) {
    const { data, error } = await ctx.supabase
      .from("tenant_knowledge_base")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("tenant_id", ctx.tenantId)
      .select("id")
      .single()
    if (error) return fail(error.message)

    await audit.log({
      action: "kb.update",
      entity: "tenant_knowledge_base",
      entityId: data.id,
      metadata: {
        section_path: parsed.data.section_path,
        title: parsed.data.title,
      },
    })
    revalidatePath(`/${ctx.tenantSlug}/settings/knowledge-base`)
    return ok({ id: data.id })
  }

  const { data, error } = await ctx.supabase
    .from("tenant_knowledge_base")
    .insert(payload)
    .select("id")
    .single()
  if (error) return fail(error.message)

  await audit.log({
    action: "kb.create",
    entity: "tenant_knowledge_base",
    entityId: data.id,
    metadata: {
      section_path: parsed.data.section_path,
      title: parsed.data.title,
    },
  })
  revalidatePath(`/${ctx.tenantSlug}/settings/knowledge-base`)
  return ok({ id: data.id })
}

export async function deleteKnowledgeBaseEntry(
  id: string,
): Promise<ActionResult> {
  const ctx = await requireRole(ADMIN_ROLES)
  const { error } = await ctx.supabase
    .from("tenant_knowledge_base")
    .delete()
    .eq("id", id)
  if (error) return fail(error.message)

  await audit.log({
    action: "kb.delete",
    entity: "tenant_knowledge_base",
    entityId: id,
  })
  revalidatePath(`/${ctx.tenantSlug}/settings/knowledge-base`)
  return ok()
}

/* ──────────────────────────────────────────────────────────────────
 * 5. Members & roles — invite / change role / remove
 * ────────────────────────────────────────────────────────────────── */

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "owner",
    "admin",
    "board",
    "committee",
    "resident",
    "vendor",
    "readonly",
  ]),
})

export async function inviteMember(
  input: z.infer<typeof InviteSchema>,
): Promise<ActionResult> {
  const parsed = InviteSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const ctx = await requireRole(ADMIN_ROLES)

  // Owner can only be granted by another owner.
  if (parsed.data.role === "owner" && ctx.role !== "owner") {
    return fail("Only an owner can invite another owner.")
  }

  const token = crypto.randomUUID().replace(/-/g, "")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const { error } = await ctx.supabase.from("tenant_invitations").insert({
    tenant_id: ctx.tenantId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: ctx.userId,
    token,
    expires_at: expiresAt,
    status: "pending",
  })
  if (error) return fail(error.message)

  await audit.log({
    action: "member.invite",
    entity: "tenant_invitations",
    metadata: { email: parsed.data.email, role: parsed.data.role },
  })

  revalidatePath(`/${ctx.tenantSlug}/settings/members`)
  return ok()
}

const ChangeRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum([
    "owner",
    "admin",
    "board",
    "committee",
    "resident",
    "vendor",
    "readonly",
  ]),
})

export async function changeMemberRole(
  input: z.infer<typeof ChangeRoleSchema>,
): Promise<ActionResult> {
  const parsed = ChangeRoleSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const ctx = await requireRole(ADMIN_ROLES)

  if (parsed.data.user_id === ctx.userId) {
    return fail("You cannot change your own role.")
  }
  if (parsed.data.role === "owner" && ctx.role !== "owner") {
    return fail("Only an owner can promote to owner.")
  }

  const { error } = await ctx.supabase
    .from("tenant_memberships")
    .update({ role: parsed.data.role })
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", parsed.data.user_id)
  if (error) return fail(error.message)

  await audit.log({
    action: "member.role_change",
    entity: "tenant_memberships",
    entityId: parsed.data.user_id,
    metadata: { role: parsed.data.role },
  })

  revalidatePath(`/${ctx.tenantSlug}/settings/members`)
  return ok()
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const ctx = await requireRole(ADMIN_ROLES)
  if (userId === ctx.userId) return fail("You cannot remove yourself.")

  const { error } = await ctx.supabase
    .from("tenant_memberships")
    .update({ status: "removed" })
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", userId)
  if (error) return fail(error.message)

  await audit.log({
    action: "member.remove",
    entity: "tenant_memberships",
    entityId: userId,
  })

  revalidatePath(`/${ctx.tenantSlug}/settings/members`)
  return ok()
}

/* ──────────────────────────────────────────────────────────────────
 * 6. Danger zone — owner only.
 * ────────────────────────────────────────────────────────────────── */

export async function requestDataExport(): Promise<ActionResult> {
  const ctx = await requireRole(OWNER_ROLES)
  await audit.log({
    action: "tenant.export_request",
    entity: "tenants",
    entityId: ctx.tenantId,
  })
  return ok()
}
