import { Button, Heading, Hr, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"
import type { TenantEmailContext } from "@/lib/email/tenant-email"

export interface FineNoticeProps {
  residentName: string
  propertyAddress: string
  category: string
  description: string
  violationId: string
  fineAmount: string
  fineDueDate: string
  paymentUrl?: string
  dashboardUrl?: string
  tenant?: Partial<TenantEmailContext>
}

export function FineNotice({
  residentName = "Homeowner",
  propertyAddress = "123 Madison Park Dr",
  category = "Landscaping",
  description = "Overgrown lawn and hedges exceeding 12 inches in height.",
  violationId = "VIO-001",
  fineAmount = "$150.00",
  fineDueDate = "April 15, 2026",
  paymentUrl,
  tenant,
}: FineNoticeProps) {
  const hoaName = tenant?.name ?? "Your HOA"
  return (
    <BaseLayout
      preview={`Fine Notice: ${fineAmount} — ${category} violation at ${propertyAddress}`}
      tenant={tenant}
    >
      <Heading style={heading}>Fine Notice</Heading>

      <Text style={text}>Dear {residentName},</Text>

      <Text style={text}>
        Following prior notices regarding the violation at your property, a fine
        has been assessed in accordance with the {hoaName} covenants and
        bylaws. We regret that this step was necessary and remain available to
        assist you.
      </Text>

      <Hr style={divider} />

      <Text style={detailLabel}>Reference</Text>
      <Text style={detailValue}>#{violationId}</Text>

      <Text style={detailLabel}>Property</Text>
      <Text style={detailValue}>{propertyAddress}</Text>

      <Text style={detailLabel}>Violation</Text>
      <Text style={detailValue}>
        {category} — {description}
      </Text>

      {/* Fine amount box */}
      <div style={fineBox}>
        <Text style={fineLabel}>Fine Amount</Text>
        <Text style={fineAmountStyle}>{fineAmount}</Text>
        <Text style={fineDue}>Due by {fineDueDate}</Text>
      </div>

      <Hr style={divider} />

      <Heading as="h3" style={subheading}>
        How to Pay
      </Heading>
      <Text style={text}>
        You may submit payment through the resident portal, by mailing a check
        to the HOA office, or by contacting our office to arrange an alternative
        payment method.
      </Text>

      {paymentUrl && (
        <Button style={button} href={paymentUrl}>
          Make a Payment
        </Button>
      )}

      <Hr style={divider} />

      <Heading as="h3" style={subheading}>
        Appeal Process
      </Heading>
      <Text style={text}>
        If you believe this fine was issued in error or wish to appeal, you may
        submit a written appeal to the HOA Board within 15 days of receiving
        this notice. Appeals can be submitted through the resident portal or
        mailed to our office. The Board will review your appeal at the next
        scheduled meeting and notify you of the outcome.
      </Text>

      <Text style={text}>
        Please note that fines not paid or appealed by the due date may accrue
        additional charges as outlined in the HOA governing documents.
      </Text>

      <Text style={closing}>
        We value you as a member of our community and hope to resolve this
        matter amicably.
      </Text>

      <Text style={signature}>
        Sincerely,
        <br />
        {hoaName} Board
      </Text>
    </BaseLayout>
  )
}

export default FineNotice

// ── Styles ────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#b91c1c",
  margin: "0 0 24px",
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
}

const subheading: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 700,
  color: "#1e3a5f",
  margin: "0 0 12px",
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

const fineBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "8px 0",
}

const fineLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const fineAmountStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 700,
  color: "#b91c1c",
  margin: "0 0 4px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const fineDue: React.CSSProperties = {
  fontSize: "13px",
  color: "#71717a",
  margin: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
