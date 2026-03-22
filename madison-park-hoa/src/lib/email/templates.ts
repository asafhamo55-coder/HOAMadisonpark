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
import {
  Invitation,
  type InvitationProps,
} from "@/emails/templates/invitation"

export type TemplateMap = {
  "violation-notice": ViolationNoticeProps
  "warning-letter": WarningLetterProps
  "fine-notice": FineNoticeProps
  "welcome-letter": WelcomeLetterProps
  "general-announcement": GeneralAnnouncementProps
  "payment-reminder": PaymentReminderProps
  "invitation": InvitationProps
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
  "invitation": Invitation,
}

export const templateSubjects: Record<TemplateName, string> = {
  "violation-notice": "Violation Notice — Madison Park HOA",
  "warning-letter": "Warning: Unresolved Violation — Madison Park HOA",
  "fine-notice": "Fine Notice — Madison Park HOA",
  "welcome-letter": "Welcome to Madison Park!",
  "general-announcement": "Community Update — Madison Park HOA",
  "payment-reminder": "HOA Dues Reminder — Madison Park HOA",
  "invitation": "You're Invited to Madison Park HOA",
}
