import {
  ViolationNotice,
  type ViolationNoticeProps,
} from "@/emails/templates/violation-notice"
import {
  WarningLetter,
  type WarningLetterProps,
} from "@/emails/templates/warning-letter"
import {
  FineNotice,
  type FineNoticeProps,
} from "@/emails/templates/fine-notice"
import {
  WelcomeLetter,
  type WelcomeLetterProps,
} from "@/emails/templates/welcome-letter"
import {
  GeneralAnnouncement,
  type GeneralAnnouncementProps,
} from "@/emails/templates/general-announcement"
import {
  PaymentReminder,
  type PaymentReminderProps,
} from "@/emails/templates/payment-reminder"

export type TemplateMap = {
  "violation-notice": ViolationNoticeProps
  "warning-letter": WarningLetterProps
  "fine-notice": FineNoticeProps
  "welcome-letter": WelcomeLetterProps
  "general-announcement": GeneralAnnouncementProps
  "payment-reminder": PaymentReminderProps
}

export type TemplateName = keyof TemplateMap

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const templates: Record<TemplateName, React.ComponentType<any>> = {
  "violation-notice": ViolationNotice,
  "warning-letter": WarningLetter,
  "fine-notice": FineNotice,
  "welcome-letter": WelcomeLetter,
  "general-announcement": GeneralAnnouncement,
  "payment-reminder": PaymentReminder,
}

/**
 * Per-template subject lines. The `${name}` placeholder is replaced at
 * send time with the active tenant's display name. Used as a default
 * subject when callers don't pass an explicit one.
 */
export const templateSubjectFns: Record<TemplateName, (name: string) => string> = {
  "violation-notice": (name) => `Violation Notice — ${name}`,
  "warning-letter": (name) => `Warning: Unresolved Violation — ${name}`,
  "fine-notice": (name) => `Fine Notice — ${name}`,
  "welcome-letter": (name) => `Welcome to ${name}!`,
  "general-announcement": (name) => `Community Update — ${name}`,
  "payment-reminder": (name) => `HOA Dues Reminder — ${name}`,
}

/**
 * @deprecated Use `templateSubjectFns[name](tenantName)` instead. This
 * legacy export is kept for backwards compatibility with callers that
 * have not yet been threaded with tenant context. It hardcodes "Your HOA"
 * so the resulting email is obviously generic if it slips through.
 */
export const templateSubjects: Record<TemplateName, string> = {
  "violation-notice": templateSubjectFns["violation-notice"]("Your HOA"),
  "warning-letter": templateSubjectFns["warning-letter"]("Your HOA"),
  "fine-notice": templateSubjectFns["fine-notice"]("Your HOA"),
  "welcome-letter": templateSubjectFns["welcome-letter"]("Your HOA"),
  "general-announcement":
    templateSubjectFns["general-announcement"]("Your HOA"),
  "payment-reminder": templateSubjectFns["payment-reminder"]("Your HOA"),
}
