"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"

import { audit } from "@/lib/audit"
import {
  getEmailFromAddress,
  loadTenantEmailContext,
} from "@/lib/email/tenant-email"
import { requireTenantContext, type TenantRole } from "@/lib/tenant"
import { tenantPath } from "@/lib/tenant-path"

const SEND_ROLES: TenantRole[] = ["owner", "admin", "board"]

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) throw new Error("RESEND_API_KEY is not set")
  if (!key.startsWith("re_")) {
    throw new Error(
      `RESEND_API_KEY has invalid format (starts with "${key.slice(0, 3)}...", expected "re_...")`,
    )
  }
  return new Resend(key)
}

export type BroadcastRecipient = {
  id: string
  full_name: string
  email: string
  property_id: string
  property_address: string
}

export type BroadcastResult = {
  total: number
  sent: number
  failed: number
  results: Array<{
    recipientEmail: string
    residentName: string
    success: boolean
    error?: string
    messageId?: string
  }>
}

export async function sendBroadcast({
  recipients,
  subject,
  bodyTemplate,
  type,
}: {
  recipients: BroadcastRecipient[]
  subject: string
  bodyTemplate: string
  type: string
}): Promise<BroadcastResult> {
  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  if (!SEND_ROLES.includes(role)) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
      results: [
        {
          recipientEmail: "",
          residentName: "",
          success: false,
          error: "Forbidden",
        },
      ],
    }
  }

  const tenantEmail = await loadTenantEmailContext(supabase, tenantId)
  const fromAddress = getEmailFromAddress(tenantEmail)

  const results: BroadcastResult["results"] = []

  for (const recipient of recipients) {
    // Replace template variables
    const personalizedBody = bodyTemplate
      .replace(/\{\{resident_name\}\}/g, recipient.full_name)
      .replace(/\{\{property_address\}\}/g, recipient.property_address)
      .replace(/\{\{hoa_name\}\}/g, tenantEmail.legalName ?? tenantEmail.name)
      .replace(/\{\{board_president_name\}\}/g, "The Board")

    const personalizedSubject = subject
      .replace(/\{\{resident_name\}\}/g, recipient.full_name)
      .replace(/\{\{property_address\}\}/g, recipient.property_address)
      .replace(/\{\{hoa_name\}\}/g, tenantEmail.name)

    const { data, error } = await getResend().emails.send({
      from: fromAddress,
      to: [recipient.email],
      subject: personalizedSubject,
      html: personalizedBody,
    })

    const success = !error
    results.push({
      recipientEmail: recipient.email,
      residentName: recipient.full_name,
      success,
      error: error?.message,
      messageId: data?.id,
    })

    // Save to letters table — RLS will clamp to tenant.
    await supabase.from("letters").insert({
      tenant_id: tenantId,
      property_id: recipient.property_id,
      resident_id: recipient.id,
      type,
      subject: personalizedSubject,
      body_html: personalizedBody,
      sent_at: success ? new Date().toISOString() : null,
      sent_by: userId,
      recipient_email: recipient.email,
      resend_message_id: data?.id || null,
      status: success ? "sent" : "failed",
    })
  }

  await audit.log({
    action: "email.broadcast",
    entity: "letters",
    metadata: {
      type,
      recipient_count: recipients.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  })

  revalidatePath(tenantPath(tenantSlug, "email"))

  return {
    total: recipients.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  }
}
