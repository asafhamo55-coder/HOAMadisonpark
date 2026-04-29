import type { Metadata } from "next"

import { LegalShell } from "@/components/marketing/legal-shell"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description: `${BRAND.name} data processing addendum — draft.`,
  alternates: { canonical: `${BRAND.url}/legal/dpa` },
  robots: { index: true, follow: true },
}

export default function DpaPage() {
  return (
    <LegalShell
      title="Data Processing Addendum"
      effectiveDate="To be set at launch"
    >
      <p>
        This Data Processing Addendum (&quot;<strong>DPA</strong>&quot;) forms
        part of the Terms of Service between you (the &quot;
        <strong>Customer</strong>&quot;) and {BRAND.name} (&quot;
        <strong>Processor</strong>&quot;) and applies to all personal data
        processed by {BRAND.name} on Customer&apos;s behalf.
      </p>

      <h2>1. Roles &amp; scope</h2>
      <p>
        Customer is the &quot;controller&quot; and {BRAND.name} is the
        &quot;processor&quot; of personal data uploaded into the Service
        (residents, owners, vehicles, payment ledger entries, etc.).
        {BRAND.name} processes that data only on Customer&apos;s instructions
        and only for the purpose of providing the Service.
      </p>

      <h2>2. Sub-processors</h2>
      <p>
        Customer authorizes {BRAND.name} to engage the sub-processors listed
        in the Privacy Policy. We will give 30 days&apos; notice of any
        change to that list and Customer may object on reasonable grounds.
      </p>

      <h2>3. Security measures</h2>
      <ul>
        <li>TLS 1.2+ for all data in transit.</li>
        <li>Encryption at rest at the database layer.</li>
        <li>Postgres row-level security to enforce tenant isolation.</li>
        <li>Audit logging for every change to tenant data.</li>
        <li>Least-privilege access for {BRAND.name} personnel.</li>
        <li>Quarterly internal security reviews against OWASP Top 10.</li>
      </ul>

      <h2>4. Data-subject requests</h2>
      <p>
        {BRAND.name} will, taking into account the nature of processing,
        assist Customer in responding to data-subject requests (access,
        rectification, deletion, portability) at no additional cost. Most
        requests can be self-served via the application&apos;s admin
        interface.
      </p>

      <h2>5. Personal data breach notification</h2>
      <p>
        {BRAND.name} will notify Customer without undue delay (and within 72
        hours where feasible) of becoming aware of a personal data breach
        affecting Customer data. Notification will include scope, categories,
        approximate number of records affected, and remediation steps.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Customer data is hosted in the United States. We do not transfer
        personal data outside the US except where necessary for sub-processor
        operations (e.g., support tooling), in which case Standard
        Contractual Clauses apply.
      </p>

      <h2>7. Audit rights</h2>
      <p>
        {BRAND.name} will provide reasonable assistance in demonstrating
        compliance with this DPA. Customer may, no more than once per year and
        on 30 days&apos; written notice, request a remote audit conducted at
        Customer&apos;s expense.
      </p>

      <h2>8. Termination &amp; deletion</h2>
      <p>
        Upon termination, Customer may export all Customer data in CSV or PDF
        format for 30 days. Thereafter, {BRAND.name} will anonymize personal
        data and archive aggregates. Hard deletion occurs after 7 years.
      </p>

      <h2>9. Contact</h2>
      <p>
        DPA questions:{" "}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
      </p>
    </LegalShell>
  )
}
