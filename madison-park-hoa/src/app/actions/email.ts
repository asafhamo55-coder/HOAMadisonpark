"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import {
  templates,
  type TemplateName,
} from "@/lib/email/templates"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS =
  process.env.EMAIL_FROM || "Madison Park HOA <noreply@madisonparkhoa.com>"

export async function sendLetter({
  propertyId,
  residentId,
  violationId,
  subject,
  bodyHtml,
  recipientEmail,
  type,
}: {
  propertyId: string
  residentId?: string | null
  violationId?: string | null
  subject: string
  bodyHtml: string
  recipientEmail: string
  type: string
}) {
  const supabase = createClient()
  const user = await getCurrentUser()

  if (!user) return { error: "Unauthorized" }

  // Send via Resend
  const { data: resendData, error: resendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [recipientEmail],
    subject,
    html: bodyHtml,
  })

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
    })

    return { error: resendError.message }
  }

  // Save sent letter
  const { error: dbError } = await supabase.from("letters").insert({
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
  })

  if (dbError) {
    return { error: `Email sent but failed to save record: ${dbError.message}` }
  }

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
}: {
  propertyId: string
  residentId?: string | null
  violationId?: string | null
  subject: string
  bodyHtml: string
  recipientEmail: string
  type: string
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

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [user.email],
    subject: `[TEST] ${subject}`,
    html: bodyHtml,
  })

  if (error) return { error: error.message }
  return { messageId: data?.id }
}
