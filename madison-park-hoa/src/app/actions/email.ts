"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import {
  templates,
  type TemplateName,
} from "@/lib/email/templates"

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) throw new Error("RESEND_API_KEY is not set")
  if (!key.startsWith("re_")) {
    throw new Error(`RESEND_API_KEY has invalid format (starts with "${key.slice(0, 3)}...", expected "re_...")`)
  }
  return new Resend(key)
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.HOA_FROM_EMAIL || "Madison Park HOA <onboarding@resend.dev>"
}

export type AttachmentMeta = {
  name: string
  url: string
  size: number
  type: string
  storagePath: string
}

export async function uploadEmailAttachment(
  formData: FormData
): Promise<{ attachment?: AttachmentMeta; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const file = formData.get("file") as File | null
  if (!file || !file.size) return { error: "No file provided" }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File size must be under 10MB" }
  }

  const admin = createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase()
  const storagePath = `${user.id}/${Date.now()}-${safeName}`

  const { error: uploadError } = await admin.storage
    .from("email-attachments")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const { data: { publicUrl } } = admin.storage
    .from("email-attachments")
    .getPublicUrl(storagePath)

  // Also create a signed URL for Resend to download (bucket is private)
  const { data: signedData } = await admin.storage
    .from("email-attachments")
    .createSignedUrl(storagePath, 3600) // 1 hour expiry

  return {
    attachment: {
      name: file.name,
      url: signedData?.signedUrl || publicUrl,
      size: file.size,
      type: file.type,
      storagePath,
    },
  }
}

export async function removeEmailAttachment(storagePath: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  await admin.storage.from("email-attachments").remove([storagePath])
  return { error: null }
}

async function logAuditEntry(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown>
) {
  await supabase.from("audit_log").insert({
    user_id: userId,
    user_name: userName,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
}

export async function sendLetter({
  propertyId,
  residentId,
  violationId,
  subject,
  bodyHtml,
  recipientEmail,
  cc,
  bcc,
  type,
  attachments,
}: {
  propertyId: string
  residentId?: string | null
  violationId?: string | null
  subject: string
  bodyHtml: string
  recipientEmail: string
  cc?: string[]
  bcc?: string[]
  type: string
  attachments?: AttachmentMeta[]
}) {
  const supabase = createClient()
  const user = await getCurrentUser()

  if (!user) return { error: "Unauthorized" }

  // Build Resend attachments by downloading file content from storage
  const resendAttachments: { filename: string; content: Buffer }[] = []
  if (attachments?.length) {
    const admin = createAdminClient()
    for (const att of attachments) {
      try {
        const { data, error } = await admin.storage
          .from("email-attachments")
          .download(att.storagePath)
        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer()
          resendAttachments.push({
            filename: att.name,
            content: Buffer.from(arrayBuffer),
          })
        }
      } catch {
        // Skip attachment if download fails
      }
    }
  }

  // Send via Resend
  let resendData: { id: string } | null = null
  let resendError: { message: string } | null = null
  try {
    const result = await getResend().emails.send({
      from: getFromAddress(),
      to: [recipientEmail],
      ...(cc?.length && { cc }),
      ...(bcc?.length && { bcc }),
      subject,
      html: bodyHtml,
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
      property_id: propertyId,
      resident_id: residentId || null,
      violation_id: violationId || null,
      type,
      subject,
      body_html: bodyHtml,
      recipient_email: recipientEmail,
      sent_by: user.id,
      status: "failed",
      attachments: attachmentsMeta,
    })

    return { error: resendError.message }
  }

  // Save sent letter
  const { data: letterData, error: dbError } = await supabase.from("letters").insert({
    property_id: propertyId,
    resident_id: residentId || null,
    violation_id: violationId || null,
    type,
    subject,
    body_html: bodyHtml,
    sent_at: new Date().toISOString(),
    sent_by: user.id,
    recipient_email: recipientEmail,
    resend_message_id: resendData?.id || null,
    status: "sent",
    attachments: attachmentsMeta,
  }).select("id").single()

  if (dbError) {
    return { error: `Email sent but failed to save record: ${dbError.message}` }
  }

  // Log to audit trail for portal documentation
  await logAuditEntry(
    supabase,
    user.id,
    user.full_name || user.email || "Unknown",
    "email_sent",
    "letter",
    letterData?.id || "",
    {
      subject,
      recipient_email: recipientEmail,
      type,
      property_id: propertyId,
      resident_id: residentId || null,
      has_attachments: (attachmentsMeta.length > 0),
      attachment_count: attachmentsMeta.length,
    }
  )

  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath("/dashboard/email")

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
  const supabase = createClient()
  const user = await getCurrentUser()

  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase.from("letters").insert({
    property_id: propertyId,
    resident_id: residentId || null,
    violation_id: violationId || null,
    type,
    subject,
    body_html: bodyHtml,
    recipient_email: recipientEmail,
    sent_by: user.id,
    status: "draft",
    attachments: attachments || [],
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { success: true }
}

export async function renderTemplatePreview(
  templateName: string,
  props: Record<string, string>
): Promise<{ html?: string; error?: string }> {
  const Component = templates[templateName as TemplateName]
  if (!Component) {
    return { error: `Unknown template: ${templateName}` }
  }

  try {
    const element = createElement(Component, props)
    const html = await render(element)
    return { html }
  } catch (err) {
    return { error: `Render failed: ${(err as Error).message}` }
  }
}

export async function sendTestEmail(
  subject: string,
  bodyHtml: string
): Promise<{ error?: string; messageId?: string }> {
  const user = await getCurrentUser()
  if (!user?.email) return { error: "No email on current user profile" }

  try {
    const { data, error } = await getResend().emails.send({
      from: getFromAddress(),
      to: [user.email],
      subject: `[TEST] ${subject}`,
      html: bodyHtml,
    })

    if (error) return { error: error.message }
    return { messageId: data?.id }
  } catch (err) {
    return { error: `Email config error: ${(err as Error).message}` }
  }
}
