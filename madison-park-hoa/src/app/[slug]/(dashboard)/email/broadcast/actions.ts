"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

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
  const supabase = createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { total: 0, sent: 0, failed: 0, results: [{ recipientEmail: "", residentName: "", success: false, error: "Unauthorized" }] }
  }

  const results: BroadcastResult["results"] = []

  for (const recipient of recipients) {
    // Replace template variables
    const personalizedBody = bodyTemplate
      .replace(/\{\{resident_name\}\}/g, recipient.full_name)
      .replace(/\{\{property_address\}\}/g, recipient.property_address)
      .replace(/\{\{hoa_name\}\}/g, "Madison Park Homeowners Association")
      .replace(/\{\{board_president_name\}\}/g, "The Board")

    const personalizedSubject = subject
      .replace(/\{\{resident_name\}\}/g, recipient.full_name)
      .replace(/\{\{property_address\}\}/g, recipient.property_address)
      .replace(/\{\{hoa_name\}\}/g, "Madison Park HOA")

    const { data, error } = await getResend().emails.send({
      from: getFromAddress(),
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

    // Save to letters table
    await supabase.from("letters").insert({
      property_id: recipient.property_id,
      resident_id: recipient.id,
      type,
      subject: personalizedSubject,
      body_html: personalizedBody,
      sent_at: success ? new Date().toISOString() : null,
      sent_by: user.id,
      recipient_email: recipient.email,
      resend_message_id: data?.id || null,
      status: success ? "sent" : "failed",
    })
  }

  revalidatePath("/dashboard/email")

  return {
    total: recipients.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  }
}
