import type { Metadata } from "next"

import { ProductPageShell } from "@/components/marketing/product-page"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "HOA Hub — HOA management software",
  description:
    "Run your homeowners association from one place: residents, violations, payments, announcements, and a resident self-service portal.",
  alternates: { canonical: `${BRAND.url}/products/hoa` },
}

export default function HoaProductPage() {
  return (
    <ProductPageShell
      eyebrow="HOA Hub"
      title="HOA management without the spreadsheet sprawl"
      subtitle="Properties, residents, violations, payments, documents, and a polished resident portal — built for boards, managers, and owners."
      features={[
        { title: "Resident portal", description: "Residents see their account, pay dues, and respond to violations." },
        { title: "Violations & fines", description: "Log a violation in 30 seconds; templated notices and escalation." },
        { title: "Online payments", description: "Track dues, fines, and special assessments per property." },
        { title: "Announcements", description: "Email broadcasts with templates and delivery activity." },
        { title: "Documents", description: "Bylaws, CC&Rs, board packets — searchable and access-controlled." },
        { title: "Vendors", description: "Manage vendor jobs, insurance, and recurring services." },
      ]}
      faqs={[
        {
          q: "Can residents log in?",
          a: "Yes — residents get their own portal scoped to their property and account.",
        },
        {
          q: "Do you support multiple HOAs?",
          a: "Each HOA is a tenant. You can run several from one Homeowner Hub account.",
        },
      ]}
    />
  )
}
