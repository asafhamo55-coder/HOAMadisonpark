import type { Metadata } from "next"
import { LeadForm } from "@/components/marketing/lead-form"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Homeowner Hub team.",
}

export default function ContactPage() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contact us</h1>
        <p className="mt-4 text-muted-foreground">
          Tell us about your portfolio. We typically reply within one business day.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-xl">
        <LeadForm />
      </div>
    </section>
  )
}
