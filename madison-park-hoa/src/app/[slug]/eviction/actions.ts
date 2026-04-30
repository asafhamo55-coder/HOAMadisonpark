"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireTenantModule } from "@/lib/modules"
import { tenantPath } from "@/lib/tenant-path"
import { computeStageDueAt, findStage, type WorkflowDefinition } from "@/lib/eviction/workflow"

const newCaseSchema = z.object({
  jurisdiction_id: z.string().uuid(),
  tenant_name: z.string().min(1),
  tenant_email: z.string().email().optional().or(z.literal("")),
  property_address: z.string().min(1),
  unit: z.string().optional(),
  rent_owed: z.coerce.number().nonnegative().optional(),
  reason: z
    .enum(["non_payment", "lease_violation", "holdover", "illegal_activity", "other"])
    .default("non_payment"),
})

export async function createEvCaseAction(formData: FormData) {
  const ctx = await requireTenantModule("eviction")
  const parsed = newCaseSchema.safeParse({
    jurisdiction_id: formData.get("jurisdiction_id"),
    tenant_name: formData.get("tenant_name"),
    tenant_email: formData.get("tenant_email") || "",
    property_address: formData.get("property_address"),
    unit: formData.get("unit") || undefined,
    rent_owed: formData.get("rent_owed") || undefined,
    reason: (formData.get("reason") as string) || "non_payment",
  })
  if (!parsed.success) return { error: "Please fill in tenant, address, and jurisdiction." }

  const { data: workflow } = await ctx.supabase
    .from("ev_workflow_definitions")
    .select("id, definition")
    .eq("jurisdiction_id", parsed.data.jurisdiction_id)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!workflow) return { error: "No active workflow for that jurisdiction." }

  const def = workflow.definition as WorkflowDefinition
  const firstStage = def.stages[0]
  if (!firstStage) return { error: "Workflow has no stages." }
  const dueAt = computeStageDueAt(firstStage)

  const { data: createdCase, error } = await ctx.supabase
    .from("ev_cases")
    .insert({
      tenant_id: ctx.tenantId,
      jurisdiction_id: parsed.data.jurisdiction_id,
      workflow_id: workflow.id,
      current_stage: firstStage.key,
      stage_due_at: dueAt?.toISOString() ?? null,
      tenant_name: parsed.data.tenant_name,
      tenant_email: parsed.data.tenant_email || null,
      property_address: parsed.data.property_address,
      unit: parsed.data.unit || null,
      rent_owed: parsed.data.rent_owed ?? null,
      reason: parsed.data.reason,
      status: "open",
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error || !createdCase) return { error: error?.message || "Could not create case." }

  await ctx.supabase.from("ev_case_events").insert({
    tenant_id: ctx.tenantId,
    case_id: createdCase.id,
    event_type: "case_opened",
    to_stage: firstStage.key,
    actor_id: ctx.userId,
  })

  revalidatePath(tenantPath(ctx.tenantSlug, "eviction"))
  revalidatePath(tenantPath(ctx.tenantSlug, "eviction", "cases"))
  redirect(tenantPath(ctx.tenantSlug, "eviction", "cases", createdCase.id))
}

export async function advanceEvStageAction(formData: FormData) {
  const ctx = await requireTenantModule("eviction")
  const caseId = formData.get("case_id") as string
  const notes = (formData.get("notes") as string) || null
  if (!caseId) return { error: "Missing case id." }

  const { data: c } = await ctx.supabase
    .from("ev_cases")
    .select("id, current_stage, workflow_id")
    .eq("id", caseId)
    .single()
  if (!c) return { error: "Case not found." }

  const { data: wf } = await ctx.supabase
    .from("ev_workflow_definitions")
    .select("definition")
    .eq("id", c.workflow_id)
    .single()
  if (!wf) return { error: "Workflow not found." }

  const def = wf.definition as WorkflowDefinition
  const cur = findStage(def, c.current_stage)
  if (!cur || !cur.next) return { error: "No next stage." }
  const nxt = findStage(def, cur.next)
  if (!nxt) return { error: "Workflow misconfigured." }

  const dueAt = computeStageDueAt(nxt)
  await ctx.supabase
    .from("ev_cases")
    .update({ current_stage: nxt.key, stage_due_at: dueAt?.toISOString() ?? null })
    .eq("id", caseId)

  await ctx.supabase.from("ev_case_events").insert({
    tenant_id: ctx.tenantId,
    case_id: caseId,
    event_type: "transition",
    from_stage: cur.key,
    to_stage: nxt.key,
    notes,
    actor_id: ctx.userId,
  })

  revalidatePath(tenantPath(ctx.tenantSlug, "eviction", "cases", caseId))
  return { ok: true }
}

export async function closeEvCaseAction(formData: FormData) {
  const ctx = await requireTenantModule("eviction")
  const caseId = formData.get("case_id") as string
  const status = (formData.get("status") as string) || "closed"
  if (!caseId) return { error: "Missing case id." }

  await ctx.supabase
    .from("ev_cases")
    .update({ status, closed_at: new Date().toISOString() })
    .eq("id", caseId)

  revalidatePath(tenantPath(ctx.tenantSlug, "eviction", "cases", caseId))
  revalidatePath(tenantPath(ctx.tenantSlug, "eviction", "cases"))
  return { ok: true }
}
