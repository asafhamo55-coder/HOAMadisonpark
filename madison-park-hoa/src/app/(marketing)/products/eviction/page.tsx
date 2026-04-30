import type { Metadata } from "next"
import { ProductPage } from "@/components/marketing/product-page"

export const metadata: Metadata = {
  title: "Eviction Hub – Stage-by-stage workflow",
  description:
    "Eviction workflows tailored per state and county. Notices, deadlines, filings, and outcomes — without the spreadsheet.",
}

export default function EvictionProductPage() {
  return (
    <ProductPage
      eyebrow="Eviction Hub"
      title="A workflow that knows your jurisdiction"
      subtitle="Eviction is hyperlocal. We model the steps, deadlines, and notices for each state and county — so you stop researching and start moving cases forward."
      features={[
        { title: "State + county playbooks", description: "Each playbook captures the steps, forms, and statutory waiting periods for that jurisdiction." },
        { title: "Deadline tracking", description: "Auto-computed deadlines for cures, filings, and hearings — with reminders." },
        { title: "Document generation", description: "Notices and filings drafted from your case data." },
        { title: "Stage tracker", description: "See every case's stage at a glance, with audit trail of every event." },
        { title: "Case files", description: "Upload service-of-process, court filings, and judgments — searchable." },
        { title: "Outcomes", description: "Track judgments, possession, and money collected per case." },
      ]}
      faqs={[
        {
          q: "Which jurisdictions do you support today?",
          a: "We launch with Georgia — Rockdale County and DeKalb County (Decatur). Additional counties roll out by request.",
        },
        {
          q: "Is this legal advice?",
          a: "No. Eviction Hub is workflow software. Use it alongside qualified legal counsel for your jurisdiction.",
        },
      ]}
    />
  )
}
