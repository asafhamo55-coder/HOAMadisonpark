"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"

import { audit } from "@/lib/audit"
import {
  getEmailFromAddress,
  loadTenantEmailContext,
} from "@/lib/email/tenant-email"
import {
  templates,
  type TemplateName,
} from "@/lib/email/templates"
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

export type AttachmentMeta = {
  name: string
  url: string
  size: number
  type: string
  storagePath: string
}

export async function uploadEmailAttachment(
  formData: FormData,
): Promise<{ attachment?: AttachmentMeta; error?: string }> {
  const { supabase, tenantId, userId } = await requireTenantContext()

  const file = formData.get("file") as File | null
  if (!file || !file.size) return { error: "No file provided" }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File size must be under 10MB" }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase()
  // Stream A's storage policies clamp the email-attachments bucket to
  // <tenant_id>/<...>. We additionally include the user id for
  // troubleshooting / per-user scoping.
  const storagePath = `${tenantId}/${userId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from("email-attachments")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("email-attachments").getPublicUrl(storagePath)

  return {
    attachment: {
      name: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type,
      storagePath,
    },
  }
}

export async function removeEmailAttachment(storagePath: string) {
  const { supabase, tenantId } = await requireTenantContext()

  // Defense-in-depth: refuse to delete attachments that aren't under
  // this tenant's prefix. Storage policies enforce the same — this is
  // a quick early-out.
  if (!storagePath.startsWith(`${tenantId}/`)) {
    return { error: "Forbidden" }
  }

  await supabase.storage.from("email-attachments").remove([storagePath])
  return { error: null }
}

export async function sendLetter({
  propertyId,
  residentId,
  violationId,
  subject,
  bodyHtml,
  recipientEmail,
  type,
  attachments,
}: {
  propertyId: string
  residentId?: string | null
  violationId?: string | null
  subject: string
  bodyHtml: string
  recipientEmail: string
  type: string
  attachments?: AttachmentMeta[]
}) {
  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  if (!SEND_ROLES.includes(role)) {
    return { error: "Forbidden" }
  }

  const tenantEmail = await loadTenantEmailContext(supabase, tenantId)

  // Build Resend attachments from uploaded files
  const resendAttachments: { filename: string; path: string }[] = []
  if (attachments?.length) {
    for (const att of attachments) {
      resendAttachments.push({
        filename: att.name,
        path: att.url,
      })
    }
  }

  // Send via Resend
  let resendData: { id: string } | null = null
  let resendError: { message: string } | null = null
  try {
    const result = await getResend().emails.send({
      from: getEmailFromAddress(tenantEmail),
      to: [recipientEmail],
      subject,
      html: bodyHtml,
      replyTo: tenantEmail.replyTo ?? undefined,
      ...(resendAttachments.length > 0 && { attachments: resendAttachments }),
    })
    resendData = result.data
    resendError = result.error
  } catch (err) {
    return { error: `Email config error: ${(err as Error).message}` }
  }

  const attachmentsMeta = attachments?.length ? attachments : []

  if (resendError) {
    // Save as failed letter
    await supabase.from("letters").insert({
      tenant_id: tenantId,
      property_id: propertyId,
      resident_id: residentId || null,
      violation_id: violationId || null,
      type,
      subject,
      body_html: bodyHtml,
      recipient_email: recipientEmail,
      sent_by: userId,
      status: "failed",
      attachments: attachmentsMeta,
    })

    return { error: resendError.message }
  }

  // Save sent letter
  const { data: letterData, error: dbError } = await supabase
    .from("letters")
    .insert({
      tenant_id: tenantId,
      property_id: propertyId,
      resident_id: residentId || null,
      violation_id: violationId || null,
      type,
      subject,
      body_html: bodyHtml,
      sent_at: new Date().toISOString(),
      sent_by: userId,
      recipient_email: recipientEmail,
      resend_message_id: resendData?.id || null,
      status: "sent",
      attachments: attachmentsMeta,
    })
    .select("id")
    .single()

  if (dbError) {
    return { error: `Email sent but failed to save record: ${dbError.message}` }
  }

  // Tenant-scoped audit log (replaces the legacy logAuditEntry helper).
  await audit.log({
    action: "letter.send",
    entity: "letters",
    entityId: letterData?.id,
    metadata: {
      subject,
      recipient_email: recipientEmail,
      type,
      property_id: propertyId,
      resident_id: residentId || null,
      violation_id: violationId || null,
      has_attachments: attachmentsMeta.length > 0,
      attachment_count: attachmentsMeta.length,
    },
  })

  revalidatePath(tenantPath(tenantSlug, "properties", propertyId))
  revalidatePath(tenantPath(tenantSlug, "email"))

  return { success: true, messageId: resendData?.id }
}

export async function saveDraft({
  propertyId,
  residentId,
  violationId,
  subject,
  bodyHtml,
  recipientEmail,
  type,
  attachments,
}: {
  propertyId: string
  residentId?: string | null
  violationId?: string | null
  subject: string
  bodyHtml: string
  recipientEmail: string
  type: string
  attachments?: AttachmentMeta[]
}) {
  const { supabase, role, tenantId, tenantSlug, userId } =
    await requireTenantContext()
  if (!SEND_ROLES.includes(role)) {
    return { error: "Forbidden" }
  }

  const { data, error } = await supabase
    .from("letters")
    .insert({
      tenant_id: tenantId,
      property_id: propertyId,
      resident_id: residentId || null,
      violation_id: violationId || null,
      type,
      subject,
      body_html: bodyHtml,
      recipient_email: recipientEmail,
      sent_by: userId,
      status: "draft",
      attachments: attachments || [],
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  await audit.log({
    action: "letter.draft",
    entity: "letters",
    entityId: data?.id,
    metadata: { property_id: propertyId, type },
  })

  revalidatePath(tenantPath(tenantSlug, "properties", propertyId))
  return { success: true }
}

export async function renderTemplatePreview(
  templateName: string,
  props: Record<string, string>,
): Promise<{ html?: string; error?: string }> {
  const { supabase, tenantId } = await requireTenantContext()

  const Component = templates[templateName as TemplateName]
  if (!Component) {
    return { error: `Unknown template: ${templateName}` }
  }

  try {
    const tenant = await loadTenantEmailContext(supabase, tenantId)
    const element = createElement(Component, { ...props, tenant })
    const html = await render(element)
    return { html }
  } catch (err) {
    return { error: `Render failed: ${(err as Error).message}` }
  }
}

export async function sendTestEmail(
  subject: string,
  bodyHtml: string,
): Promise<{ error?: string; messageId?: string }> {
  const { supabase, tenantId, userId } = await requireTenantContext()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: "No email on current user profile" }

  const tenantEmail = await loadTenantEmailContext(supabase, tenantId)

  try {
    const { data, error } = await getResend().emails.send({
      from: getEmailFromAddress(tenantEmail),
      to: [user.email],
      subject: `[TEST] ${subject}`,
      html: bodyHtml,
      replyTo: tenantEmail.replyTo ?? undefined,
    })

    if (error) return { error: error.message }

    await audit.log({
      action: "email.test_send",
      metadata: { subject, recipient: user.email, user_id: userId },
    })

    return { messageId: data?.id }
  } catch (err) {
    return { error: `Email config error: ${(err as Error).message}` }
  }
}
