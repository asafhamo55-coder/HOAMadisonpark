import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"
import {
  templates,
  templateSubjects,
  type TemplateName,
  type TemplateMap,
} from "./templates"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS =
  process.env.EMAIL_FROM || process.env.HOA_FROM_EMAIL || "Madison Park HOA <noreply@madisonparkhoa.com>"

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

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
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
