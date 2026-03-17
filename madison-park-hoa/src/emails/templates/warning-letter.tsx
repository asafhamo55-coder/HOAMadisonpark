import { Button, Heading, Hr, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"

export interface WarningLetterProps {
  residentName: string
  propertyAddress: string
  category: string
  description: string
  originalNoticeDate: string
  violationId: string
  dueDate: string
  fineAmount?: string
  dashboardUrl?: string
}

export function WarningLetter({
  residentName = "Homeowner",
  propertyAddress = "123 Madison Park Dr",
  category = "Landscaping",
  description = "Overgrown lawn and hedges exceeding 12 inches in height.",
  originalNoticeDate = "February 15, 2026",
  violationId = "VIO-001",
  dueDate = "March 30, 2026",
  fineAmount = "$150.00",
  dashboardUrl = "https://madisonparkhoa.com/dashboard",
}: WarningLetterProps) {
  return (
    <BaseLayout
      preview={`Warning: Unresolved ${category} violation — ${propertyAddress}`}
    >
      <Heading style={heading}>Warning — Second Notice</Heading>

      <Text style={text}>Dear {residentName},</Text>

      <Text style={text}>
        We are following up on the violation notice sent to you on{" "}
        <strong>{originalNoticeDate}</strong> regarding your property at{" "}
        <strong>{propertyAddress}</strong>. Our records indicate that the matter
        described below has not yet been resolved.
      </Text>

      <Hr style={divider} />

      <Text style={detailLabel}>Reference</Text>
      <Text style={detailValue}>#{violationId}</Text>

      <Text style={detailLabel}>Category</Text>
      <Text style={detailValue}>{category}</Text>

      <Text style={detailLabel}>Description</Text>
      <Text style={detailValue}>{description}</Text>

      <Text style={detailLabel}>Original Notice Date</Text>
      <Text style={detailValue}>{originalNoticeDate}</Text>

      <Hr style={divider} />

      <Text style={text}>
        We understand that circumstances may have delayed your ability to address
        this, and we want to work with you. However, per the Madison Park HOA
        covenants, unresolved violations may result in a fine of{" "}
        <strong>{fineAmount}</strong> if not corrected by{" "}
        <strong>{dueDate}</strong>.
      </Text>

      <Text style={text}>
        If you have already resolved this issue, please let us know so we can
        update our records. If you need additional time or wish to discuss the
        matter, we encourage you to contact the board directly — we are here to
        help.
      </Text>

      <Text style={importantText}>
        Please resolve this matter by {dueDate} to avoid further action.
      </Text>

      {dashboardUrl && (
        <Button style={button} href={dashboardUrl}>
          View in Resident Portal
        </Button>
      )}

      <Text style={closing}>
        We appreciate your prompt attention to this matter and your commitment to
        our community.
      </Text>

      <Text style={signature}>
        Sincerely,
        <br />
        Madison Park HOA Board
      </Text>
    </BaseLayout>
  )
}

export default WarningLetter

// ── Styles ────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#b91c1c",
  margin: "0 0 24px",
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
}

const text: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#27272a",
  margin: "0 0 16px",
}

const importantText: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#b91c1c",
  fontWeight: 600,
  margin: "0 0 24px",
  padding: "12px 16px",
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #b91c1c",
  borderRadius: "0 4px 4px 0",
}

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
}

const detailLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 2px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const detailValue: React.CSSProperties = {
  fontSize: "15px",
  color: "#27272a",
  margin: "0 0 12px",
}

const button: React.CSSProperties = {
  backgroundColor: "#1e3a5f",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const closing: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#27272a",
  margin: "24px 0 16px",
}

const signature: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#27272a",
  margin: "0",
}
