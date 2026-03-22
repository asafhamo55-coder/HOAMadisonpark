import { Button, Heading, Hr, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"

export interface InvitationProps {
  role: string
  inviteUrl: string
}

export function Invitation({
  role = "resident",
  inviteUrl = "https://madisonparkhoa.com/set-password",
}: InvitationProps) {
  const roleName = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <BaseLayout preview="You've been invited to Madison Park HOA">
      <Heading style={heading}>You&apos;re Invited!</Heading>

      <Text style={text}>
        You have been invited to join the Madison Park Homeowners Association
        portal as a <strong>{roleName}</strong>.
      </Text>

      <Text style={text}>
        Click the button below to set up your password and access your account.
        This link will expire in 24 hours.
      </Text>

      <Button style={button} href={inviteUrl}>
        Set Up Your Account
      </Button>

      <Hr style={divider} />

      <Text style={smallText}>
        If you did not expect this invitation, you can safely ignore this email.
        If you have any questions, please contact the HOA Board.
      </Text>
    </BaseLayout>
  )
}

export default Invitation

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

const smallText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#71717a",
  margin: "0",
}

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
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
