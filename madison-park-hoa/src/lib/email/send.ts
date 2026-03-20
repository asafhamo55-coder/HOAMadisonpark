import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"
import {
  templates,
  templateSubjects,
  type TemplateName,
  type TemplateMap,
} from "./templates"

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) throw new Error("RESEND_API_KEY is not set")
  if (!key.startsWith("re_")) {
    throw new Error(`RESEND_API_KEY has invalid format (starts with "${key.slice(0, 3)}...", expected "re_...")`)
  }
  return new Resend(key)
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.HOA_FROM_EMAIL || "Madison Park HOA <noreply@madisonparkhoa.com>"
}

interface SendEmailOptions<T extends TemplateName> {
  to: string | string[]
  subject?: string
  template: T
  props: TemplateMap[T]
  replyTo?: string
}

export async function sendEmail<T extends TemplateName>({
  to,
  subject,
  template,
  props,
  replyTo,
}: SendEmailOptions<T>) {
  const Component = templates[template]
  if (!Component) {
    throw new Error(`Unknown email template: ${template}`)
  }

  const emailSubject = subject || templateSubjects[template]
  const element = createElement(Component, props)
  const html = await render(element)

  const { data, error } = await getResend().emails.send({
    from: getFromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject: emailSubject,
    html,
    replyTo,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { id: data?.id }
}

export async function previewEmail<T extends TemplateName>(
  template: T,
  props: TemplateMap[T]
): Promise<string> {
  const Component = templates[template]
  if (!Component) {
    throw new Error(`Unknown email template: ${template}`)
  }

  const element = createElement(Component, props)
  return render(element)
}
