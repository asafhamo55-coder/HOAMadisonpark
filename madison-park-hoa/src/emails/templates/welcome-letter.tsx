import { Button, Heading, Hr, Link, Text } from "@react-email/components"
import * as React from "react"
import { BaseLayout } from "../base-layout"

export interface WelcomeLetterProps {
  residentName: string
  propertyAddress: string
  moveInDate?: string
  dashboardUrl?: string
  portalLoginUrl?: string
}

export function WelcomeLetter({
  residentName = "New Neighbor",
  propertyAddress = "123 Madison Park Dr",
  portalLoginUrl = "https://madisonparkhoa.com/login",
}: WelcomeLetterProps) {
  return (
    <BaseLayout preview={`Welcome to Madison Park, ${residentName}!`}>
      <Heading style={heading}>Welcome to Madison Park!</Heading>

      <Text style={text}>Dear {residentName},</Text>

      <Text style={text}>
        On behalf of the entire Madison Park Homeowners Association Board and
        your new neighbors, we are thrilled to welcome you to our community!
        We&apos;re glad you chose to make {propertyAddress} your home.
      </Text>

      <Hr style={divider} />

      <Heading as="h3" style={subheading}>
        About Our Community
      </Heading>
      <Text style={text}>
        Madison Park is a vibrant neighborhood in Johns Creek, Georgia. Our HOA
        works to maintain the quality of life, property values, and sense of
        community that make this area special. We host seasonal events, maintain
        common areas, and provide resources to help every resident thrive.
      </Text>

      <Heading as="h3" style={subheading}>
        A Few Things to Know
      </Heading>
      <Text style={listItem}>
        <strong>HOA Dues</strong> — Quarterly dues help fund landscaping,
        amenities, and community improvements. You&apos;ll receive a payment
        schedule separately.
      </Text>
      <Text style={listItem}>
        <strong>Architectural Review</strong> — Any exterior modifications
        (paint colors, fencing, additions) require approval before you begin.
        Submit requests through the resident portal.
      </Text>
      <Text style={listItem}>
        <strong>Common Areas</strong> — The pool, clubhouse, and walking trails
        are available to all residents. Access information is in your welcome
        packet.
      </Text>
      <Text style={listItem}>
        <strong>Parking & Vehicles</strong> — Please park in driveways or
        garages. Street parking is for guests only and limited to 48 hours.
      </Text>
      <Text style={listItem}>
        <strong>Yard Maintenance</strong> — Lawns should be mowed regularly and
        landscaping kept tidy. The HOA provides seasonal reminders.
      </Text>

      <Hr style={divider} />

      <Heading as="h3" style={subheading}>
        Your Resident Portal
      </Heading>
      <Text style={text}>
        We have an online portal where you can view community updates, submit
        maintenance requests, make payments, and connect with neighbors. We
        encourage you to set up your account right away.
      </Text>

      {portalLoginUrl && (
        <Button style={button} href={portalLoginUrl}>
          Set Up Your Account
        </Button>
      )}

      <Hr style={divider} />

      <Heading as="h3" style={subheading}>
        Get in Touch
      </Heading>
      <Text style={text}>
        Questions? Concerns? Just want to say hello? The HOA Board is here for
        you. Reach out anytime at{" "}
        <Link href="tel:7705550142" style={link}>
          (770) 555-0142
        </Link>{" "}
        or through the resident portal. Board meetings are held on the first
        Tuesday of each month — all residents are welcome.
      </Text>

      <Text style={closing}>
        We look forward to getting to know you. Welcome home!
      </Text>

      <Text style={signature}>
        Warmly,
        <br />
        Madison Park HOA Board
      </Text>
    </BaseLayout>
  )
}

export default WelcomeLetter

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
  margin: "0 0 12px",
  paddingLeft: "8px",
  borderLeft: "3px solid #1e3a5f",
}

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
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
