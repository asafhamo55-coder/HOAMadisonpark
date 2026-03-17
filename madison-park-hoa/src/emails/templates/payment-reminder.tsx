import { Button, Heading, Hr, Link, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"

export interface PaymentReminderProps {
  residentName: string
  propertyAddress: string
  amountDue: string
  dueDate: string
  period?: string
  accountNumber?: string
  paymentUrl?: string
  dashboardUrl?: string
}

export function PaymentReminder({
  residentName = "Homeowner",
  amountDue = "$375.00",
  dueDate = "April 1, 2026",
  period = "Q2 2026",
  accountNumber = "MP-10042",
  paymentUrl = "https://madisonparkhoa.com/dashboard/payments",
}: PaymentReminderProps) {
  return (
    <BaseLayout
      preview={`HOA Dues Reminder: ${amountDue} due ${dueDate}`}
    >
      <Heading style={heading}>Payment Reminder</Heading>

      <Text style={text}>Dear {residentName},</Text>

      <Text style={text}>
        This is a friendly reminder that your HOA dues for{" "}
        <strong>{period}</strong> are due soon. Timely payments help us
        maintain the amenities and services that make Madison Park a great place
        to call home.
      </Text>

      {/* Payment summary box */}
      <div style={paymentBox}>
        <Text style={paymentLabel}>Amount Due</Text>
        <Text style={paymentAmount}>{amountDue}</Text>
        <Text style={paymentDue}>Due by {dueDate}</Text>
        {accountNumber && (
          <Text style={paymentAccount}>Account: {accountNumber}</Text>
        )}
      </div>

      <Hr style={divider} />

      <Heading as="h3" style={subheading}>
        How to Pay
      </Heading>

      <Text style={listItem}>
        <strong>Online</strong> — Pay securely through the resident portal with
        a credit card or bank transfer.
      </Text>
      <Text style={listItem}>
        <strong>By Mail</strong> — Send a check payable to &quot;Madison Park
        HOA&quot; to our office at 123 Madison Park Drive, Johns Creek, GA
        30022.
      </Text>
      <Text style={listItem}>
        <strong>Auto-Pay</strong> — Set up automatic payments in the resident
        portal to never miss a due date.
      </Text>

      {paymentUrl && (
        <Button style={button} href={paymentUrl}>
          Pay Online Now
        </Button>
      )}

      <Hr style={divider} />

      <Text style={text}>
        If you&apos;ve already submitted your payment, thank you! Please
        disregard this reminder. Payments may take 2–3 business days to process.
      </Text>

      <Text style={text}>
        If you have questions about your account or need to discuss a payment
        plan, please contact us at{" "}
        <Link href="tel:7705550142" style={link}>
          (770) 555-0142
        </Link>
        . We&apos;re happy to work with you.
      </Text>

      <Text style={closing}>Thank you for being a valued member of our community.</Text>

      <Text style={signature}>
        Warm regards,
        <br />
        Madison Park HOA Board
      </Text>
    </BaseLayout>
  )
}

export default PaymentReminder

// ── Styles ────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#1e3a5f",
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

const listItem: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#27272a",
  margin: "0 0 10px",
  paddingLeft: "8px",
  borderLeft: "3px solid #1e3a5f",
}

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
}

const paymentBox: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "8px 0",
}

const paymentLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const paymentAmount: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 700,
  color: "#1e3a5f",
  margin: "0 0 4px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const paymentDue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1e3a5f",
  margin: "0 0 2px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const paymentAccount: React.CSSProperties = {
  fontSize: "12px",
  color: "#71717a",
  margin: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const link: React.CSSProperties = {
  color: "#1e3a5f",
  textDecoration: "underline",
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
