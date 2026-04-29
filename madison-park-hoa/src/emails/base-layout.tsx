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

import type { TenantEmailContext } from "@/lib/email/tenant-email"

interface BaseLayoutProps {
  preview: string
  /**
   * Tenant branding/contact info. When omitted (e.g. local preview /
   * Storybook) the layout falls back to env vars + safe defaults so it
   * still renders. In production every send-action must pass a tenant.
   */
  tenant?: Partial<TenantEmailContext>
  children: React.ReactNode
}

const DEFAULT_NAME = "Your HOA"

export function BaseLayout({ preview, tenant, children }: BaseLayoutProps) {
  const name =
    tenant?.name ?? process.env.NEXT_PUBLIC_HOA_NAME ?? DEFAULT_NAME
  const legalName = tenant?.legalName ?? `${name} Homeowners Association`
  const address = tenant?.address ?? null
  const phone = tenant?.phone ?? null
  const website = tenant?.website ?? null
  const logoUrl =
    tenant?.branding?.logo_url ?? process.env.NEXT_PUBLIC_HOA_LOGO_URL ?? null
  const primary = tenant?.branding?.primary_color ?? "#1e3a5f"
  const subtitleColor = tenant?.branding?.secondary_color ?? "#94a3b8"

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: primary }}>
            {logoUrl && (
              <Img
                src={logoUrl}
                width="64"
                height="64"
                alt={name}
                style={logo}
              />
            )}
            <Text style={headerTitle}>{legalName}</Text>
            {address && (
              <Text style={{ ...headerSubtitle, color: subtitleColor }}>
                {address.split("\n")[0]}
              </Text>
            )}
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerHr} />
            <Text style={{ ...footerSentOn, color: primary }}>
              Sent on behalf of the {name} Board
            </Text>
            <Text style={footerText}>
              {legalName}
              {address && (
                <>
                  <br />
                  {address.split("\n").map((line, idx, arr) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </>
              )}
              {(phone || website) && (
                <>
                  <br />
                  {phone}
                  {phone && website ? " | " : null}
                  {website && (
                    <Link
                      href={website}
                      style={{ ...footerLink, color: primary }}
                    >
                      {website.replace(/^https?:\/\//, "")}
                    </Link>
                  )}
                </>
              )}
            </Text>
            <Text style={footerSmall}>
              You are receiving this email because you are a resident or
              property owner in {name}.
              {phone &&
                ` If you believe you received this in error, please contact our office at ${phone}.`}
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
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
}

const header: React.CSSProperties = {
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
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
}

const headerSubtitle: React.CSSProperties = {
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
