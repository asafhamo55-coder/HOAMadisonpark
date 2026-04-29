import { Resend } from "resend"
import { render } from "@react-email/components"
import { createElement } from "react"

import { getTenantContext } from "@/lib/tenant"
import {
  getEmailFromAddress,
  loadTenantEmailContext,
  type TenantEmailContext,
} from "./tenant-email"
import {
  templates,
  templateSubjectFns,
  type TemplateName,
  type TemplateMap,
} from "./templates"

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

interface SendEmailOptions<T extends TemplateName> {
  to: string | string[]
  subject?: string
  template: T
  props: TemplateMap[T]
  replyTo?: string
  /**
   * Optional pre-loaded tenant context. If omitted, `sendEmail` will
   * resolve the active tenant via `getTenantContext()` and load
   * `tenant_settings` once. Pass this when sending in bulk to avoid
   * repeated lookups.
   */
  tenant?: TenantEmailContext
}

/**
 * Render and send an email with tenant-aware branding.
 *
 * Looks up the active tenant's email context (name, branding,
 * `email_from`, reply_to, signature) so the email matches the tenant
 * a recipient is associated with. Throws if there is no tenant
 * context — every email send must be tied to a tenant for compliance
 * reasons (audit trail, footer attribution, etc.).
 */
export async function sendEmail<T extends TemplateName>({
  to,
  subject,
  template,
  props,
  replyTo,
  tenant: providedTenant,
}: SendEmailOptions<T>) {
  const Component = templates[template]
  if (!Component) {
    throw new Error(`Unknown email template: ${template}`)
  }

  // Resolve tenant context once. We accept a pre-loaded one for bulk
  // sends so we don't hammer the database.
  let tenant = providedTenant
  if (!tenant) {
    const ctx = await getTenantContext()
    tenant = await loadTenantEmailContext(ctx.supabase, ctx.tenantId)
  }

  const emailSubject = subject || templateSubjectFns[template](tenant.name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(Component, { ...(props as any), tenant })
  const html = await render(element)

  const { data, error } = await getResend().emails.send({
    from: getEmailFromAddress(tenant),
    to: Array.isArray(to) ? to : [to],
    subject: emailSubject,
    html,
    replyTo: replyTo ?? tenant.replyTo ?? undefined,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { id: data?.id }
}

/**
 * Render an email template to HTML. Tenant context is required so the
 * preview reflects the same branding the recipient would see. The
 * caller passes `tenant` directly because previews often run outside
 * of a tenant request context (e.g. server actions using
 * `requireTenantContext()` already have it loaded).
 */
export async function previewEmail<T extends TemplateName>(
  template: T,
  props: TemplateMap[T],
  tenant?: Partial<TenantEmailContext>,
): Promise<string> {
  const Component = templates[template]
  if (!Component) {
    throw new Error(`Unknown email template: ${template}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(Component, { ...(props as any), tenant })
  return render(element)
}
