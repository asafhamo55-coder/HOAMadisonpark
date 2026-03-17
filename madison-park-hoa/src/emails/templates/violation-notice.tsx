import { Button, Heading, Hr, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"

export interface ViolationNoticeProps {
  residentName: string
  propertyAddress: string
  category: string
  description: string
  reportedDate: string
  dueDate: string
  violationId: string
  dashboardUrl?: string
}

export function ViolationNotice({
  residentName = "Homeowner",
  propertyAddress = "123 Madison Park Dr",
  category = "Landscaping",
  description = "Overgrown lawn and hedges exceeding 12 inches in height.",
  reportedDate = "March 15, 2026",
  dueDate = "April 14, 2026",
  violationId = "VIO-001",
  dashboardUrl = "https://madisonparkhoa.com/dashboard",
}: ViolationNoticeProps) {
  return (
    <BaseLayout preview={`Violation Notice: ${category} — ${propertyAddress}`}>
      <Heading style={heading}>Violation Notice</Heading>

      <Text style={text}>Dear {residentName},</Text>

      <Text style={text}>
        We hope this message finds you well. During a recent property review, we
        identified a matter at your home that we&apos;d like to bring to your
        attention. Our goal is to work together to keep Madison Park a wonderful
        place to live for everyone.
      </Text>

      <Hr style={divider} />

      <Text style={detailLabel}>Property</Text>
      <Text style={detailValue}>{propertyAddress}</Text>

      <Text style={detailLabel}>Category</Text>
      <Text style={detailValue}>{category}</Text>

      <Text style={detailLabel}>Description</Text>
      <Text style={detailValue}>{description}</Text>

      <Text style={detailLabel}>Reported</Text>
      <Text style={detailValue}>{reportedDate}</Text>

      <Text style={detailLabel}>Reference</Text>
      <Text style={detailValue}>#{violationId}</Text>

      <Hr style={divider} />

      <Text style={text}>
        We kindly ask that this matter be resolved by{" "}
        <strong>{dueDate}</strong>. That gives you 30 days from the date of this
        notice. In most cases, a quick adjustment is all that&apos;s needed.
      </Text>

      <Text style={text}>
        If you&apos;ve already addressed this issue, or if you have questions or
        need additional time, please don&apos;t hesitate to reach out. We&apos;re
        happy to discuss the situation with you.
      </Text>

      {dashboardUrl && (
        <Button style={button} href={dashboardUrl}>
          View in Resident Portal
        </Button>
      )}

      <Text style={closing}>
        Thank you for helping us maintain the beauty and value of our community.
      </Text>

      <Text style={signature}>
        Warm regards,
        <br />
        Madison Park HOA Board
      </Text>
    </BaseLayout>
  )
}

export default ViolationNotice

// ── Styles ────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#1e3a5f",
  margin: "0 0 24px",
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
}

const text: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#27272a",
  margin: "0 0 16px",
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
