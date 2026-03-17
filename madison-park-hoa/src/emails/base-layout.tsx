import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

const HOA_NAME = "Madison Park Homeowners Association"
const HOA_SUBTITLE = "Johns Creek, Georgia 30022"
const HOA_ADDRESS = "123 Madison Park Drive, Johns Creek, GA 30022"
const HOA_PHONE = "(770) 555-0142"
const HOA_WEBSITE = "https://madisonparkhoa.com"

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  const logoUrl = process.env.NEXT_PUBLIC_HOA_LOGO_URL

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {logoUrl && (
              <Img
                src={logoUrl}
                width="64"
                height="64"
                alt="Madison Park HOA"
                style={logo}
              />
            )}
            <Text style={headerTitle}>{HOA_NAME}</Text>
            <Text style={headerSubtitle}>{HOA_SUBTITLE}</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerHr} />
            <Text style={footerSentOn}>
              Sent on behalf of Madison Park HOA Board
            </Text>
            <Text style={footerText}>
              {HOA_NAME}
              <br />
              {HOA_ADDRESS}
              <br />
              {HOA_PHONE} |{" "}
              <Link href={HOA_WEBSITE} style={footerLink}>
                {HOA_WEBSITE.replace("https://", "")}
              </Link>
            </Text>
            <Text style={footerSmall}>
              You are receiving this email because you are a resident or property
              owner in Madison Park. If you believe you received this in error,
              please contact our office at {HOA_PHONE}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    'Georgia, "Times New Roman", Times, serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
}

const header: React.CSSProperties = {
  backgroundColor: "#1e3a5f",
  padding: "32px 24px 24px",
  textAlign: "center" as const,
}

const logo: React.CSSProperties = {
  margin: "0 auto 12px",
  borderRadius: "8px",
}

const headerTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 700,
  margin: "0 0 4px",
  fontFamily:
    'Georgia, "Times New Roman", Times, serif',
}

const headerSubtitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const content: React.CSSProperties = {
  padding: "32px",
}

const footer: React.CSSProperties = {
  padding: "0 32px 32px",
}

const footerHr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0 0 20px",
}

const footerSentOn: React.CSSProperties = {
  fontSize: "12px",
  color: "#1e3a5f",
  fontWeight: 600,
  textAlign: "center" as const,
  margin: "0 0 16px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const footerText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#71717a",
  textAlign: "center" as const,
  margin: "0 0 12px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const footerLink: React.CSSProperties = {
  color: "#1e3a5f",
  textDecoration: "underline",
}

const footerSmall: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: "16px",
  color: "#a1a1aa",
  textAlign: "center" as const,
  margin: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
