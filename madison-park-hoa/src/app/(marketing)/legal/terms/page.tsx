import type { Metadata } from "next"

import { LegalShell } from "@/components/marketing/legal-shell"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `${BRAND.name} terms of service — draft.`,
  alternates: { canonical: `${BRAND.url}/legal/terms` },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" effectiveDate="To be set at launch">
      <p>
        These Terms of Service (&quot;<strong>Terms</strong>&quot;) govern your
        use of {BRAND.name} (the &quot;<strong>Service</strong>&quot;), a
        software-as-a-service platform for residential community management.
        By signing up for an account or using the Service, you agree to these
        Terms.
      </p>

      <h2>1. Accounts &amp; communities</h2>
      <p>
        Each community (HOA, condo association, master-planned community,
        etc.) using {BRAND.name} is a separate <strong>tenant</strong>. The
        person who creates the tenant agrees to these Terms on behalf of the
        community and warrants they have authority to bind the community.
      </p>
      <p>
        Each user account belongs to a natural person and may not be shared.
        You are responsible for maintaining the confidentiality of your
        credentials and for activity under your account.
      </p>

      <h2>2. Subscription &amp; payment</h2>
      <p>
        The Service is offered on a subscription basis (Trial, Starter,
        Standard, Pro, or Enterprise). Subscriptions are billed monthly or
        annually in advance via Stripe. Annual subscriptions include a 17%
        discount. Refunds are pro-rated for annual plans cancelled mid-term;
        monthly plans are non-refundable for the current period.
      </p>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>
          Do not use the Service to harass, defame, or violate the privacy of
          residents.
        </li>
        <li>
          Do not upload malware, illegal content, or content that infringes
          third-party rights.
        </li>
        <li>
          Do not attempt to circumvent tenant isolation, access another
          tenant&apos;s data, or probe for vulnerabilities without our written
          permission.
        </li>
        <li>
          Do not resell or sublicense the Service without a written
          partnership agreement.
        </li>
      </ul>

      <h2>4. Your data</h2>
      <p>
        You own all data you upload to the Service. You grant {BRAND.name} a
        limited license to host, process, transmit, and display that data
        solely to provide the Service. You may export your data at any time
        in CSV or PDF format from within the application.
      </p>

      <h2>5. Service levels &amp; support</h2>
      <p>
        The Service is provided on an &quot;as available&quot; basis. Target
        uptime is 99.5% on an annual basis, measured at the application
        layer. Support response times vary by plan; details are listed on the
        pricing page.
      </p>

      <h2>6. Termination</h2>
      <p>
        Either party may terminate at any time for any reason. Upon
        termination, your data is preserved for 30 days to allow export, then
        anonymized and archived per our Privacy Policy.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {BRAND.name}&apos;s aggregate
        liability for any claim arising out of these Terms is limited to the
        amount you paid in the 12 months preceding the claim.
      </p>

      <h2>8. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Georgia, USA,
        without regard to conflict-of-law principles. Disputes will be
        resolved in the state or federal courts located in Fulton County,
        Georgia, unless mandatory consumer-protection law applies.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will
        be announced via email and in-app banner at least 30 days before they
        take effect.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions? Email{" "}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
      </p>
    </LegalShell>
  )
}
