import type { Metadata } from "next"
import { ProductPage } from "@/components/marketing/product-page"

export const metadata: Metadata = {
  title: "Property Management software for owners",
  description:
    "Manage every property you own: tenants, leases, rent collection, vendors, utilities, and maintenance.",
}

export default function PropertyProductPage() {
  return (
    <ProductPage
      eyebrow="Property Management"
      title="Every property. Every door. One workspace."
      subtitle="Track tenants and leases, collect rent, dispatch vendors, monitor utilities, and resolve maintenance — without juggling tools."
      features={[
        { title: "Properties & units", description: "Single-family, multi-family, mixed-use — model them all." },
        { title: "Tenants & leases", description: "Rent roll, deposits, renewals, and lease docs in one place." },
        { title: "Rent collection", description: "Recurring charges, late fees, partial payments, and statements." },
        { title: "Utilities", description: "Track meters and bills per unit; allocate to tenants." },
        { title: "Vendors", description: "Insurance certs, W-9s, and per-job tracking." },
        { title: "Maintenance", description: "Tenants submit requests; you assign, schedule, and close them out." },
      ]}
      faqs={[
        {
          q: "Can I run this alongside the HOA module?",
          a: "Yes — modules share your account, residents, and contacts where it makes sense.",
        },
        {
          q: "Do tenants get a portal?",
          a: "Yes. Tenants can pay rent, submit maintenance requests, and view their lease.",
        },
      ]}
    />
  )
}
