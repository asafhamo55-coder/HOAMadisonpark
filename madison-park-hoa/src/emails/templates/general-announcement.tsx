import { Button, Heading, Hr, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"

export interface GeneralAnnouncementProps {
  subject: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  date?: string
  fromName?: string
}

export function GeneralAnnouncement({
  subject = "Community Update",
  body = "We are excited to share some updates about our community.",
  ctaLabel,
  ctaUrl,
  date = "March 17, 2026",
  fromName = "Madison Park HOA Board",
}: GeneralAnnouncementProps) {
  // Split body by double newlines to create paragraphs
  const paragraphs = body.split(/\n\n+/).filter(Boolean)

  return (
    <BaseLayout preview={subject}>
      <Text style={dateStyle}>{date}</Text>

      <Heading style={heading}>{subject}</Heading>

      {paragraphs.map((paragraph, i) => (
        <Text key={i} style={text}>
          {paragraph}
        </Text>
      ))}

      {ctaLabel && ctaUrl && (
        <>
          <Hr style={divider} />
          <Button style={button} href={ctaUrl}>
            {ctaLabel}
          </Button>
        </>
      )}

      <Hr style={divider} />

      <Text style={signature}>
        Best regards,
        <br />
        {fromName}
      </Text>
    </BaseLayout>
  )
}

export default GeneralAnnouncement

// ── Styles ────────────────────────────────────────────────────

const dateStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#71717a",
  margin: "0 0 8px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

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
  whiteSpace: "pre-line" as const,
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

const signature: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#27272a",
  margin: "0",
}
