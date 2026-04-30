import type { Metadata } from "next"

import { LegalShell } from "@/components/marketing/legal-shell"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${BRAND.name} privacy policy — draft.`,
  alternates: { canonical: `${BRAND.url}/legal/privacy` },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" effectiveDate="To be set at launch">
      <p>
        This Privacy Policy describes how {BRAND.name} collects, uses, and
        protects information when you use our service. We are the
        &quot;<strong>controller</strong>&quot; of personal information about
        the people who sign up for an admin account. We are a &quot;
        <strong>processor</strong>&quot; for personal information that
        community admins upload about residents (see our DPA for details).
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account info:</strong> name, email, hashed password, role.
        </li>
        <li>
          <strong>Tenant info:</strong> community name, address, branding
          uploads.
        </li>
        <li>
          <strong>Usage data:</strong> pages viewed, features used, errors
          encountered. Anonymous unless you are logged in.
        </li>
        <li>
          <strong>Resident data:</strong> uploaded by community admins —
          properties, owners, residents, vehicles, documents, dues
          balances. We process this on the community&apos;s behalf, never
          for our own purposes.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To provide the Service to you and your community.</li>
        <li>
          To send transactional emails (signup, password reset, billing
          receipts, in-app notifications you opted into).
        </li>
        <li>
          To improve the Service via aggregated, anonymized analytics
          (PostHog).
        </li>
        <li>
          We <strong>do not</strong> sell personal information. We do not
          share resident data across tenants. We do not train AI models on
          your data.
        </li>
      </ul>

      <h2>3. Sub-processors</h2>
      <p>
        We rely on a small set of vetted sub-processors. Current list:
        Supabase (database + auth), Resend (email delivery), Stripe
        (payments), Vercel (hosting), PostHog (product analytics). Each is
        contractually bound to handle data only on our instructions.
      </p>

      <h2>4. Retention</h2>
      <p>
        Active tenant data is retained for as long as the subscription is
        active. After cancellation, full data is preserved for 30 days for
        export. Personally identifiable information is then anonymized and
        aggregate data is archived. Hard deletion occurs after 7 years
        unless legal hold applies.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You can view, export, correct, or delete personal information about
        yourself at any time from inside the application. For requests
        about resident data, contact your community admin first; if they
        cannot help, email{" "}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
      </p>

      <h2>6. Security</h2>
      <p>
        All traffic is encrypted in transit (TLS 1.2+). Data at rest is
        encrypted at the database layer. Tenant isolation is enforced via
        Postgres row-level security. We follow OWASP Top 10 guidance and
        run quarterly self-reviews; an external pen test will be scheduled
        once we reach the contractual triggers in the DPA.
      </p>

      <h2>7. Children</h2>
      <p>
        The Service is not directed at children under 13. We do not
        knowingly collect personal information from children.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this Privacy Policy from time to time. Material
        changes will be announced via email and in-app banner at least 30
        days before they take effect.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions? Email{" "}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
      </p>
    </LegalShell>
  )
}
