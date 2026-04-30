import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Module-based pricing. Pay only for what you turn on.",
}

const TIERS = [
  {
    name: "HOA Hub",
    price: 99,
    blurb: "Per HOA, per month. Up to 200 properties.",
    bullets: ["Resident portal", "Violations & fines", "Online payments", "Documents & announcements"],
  },
  {
    name: "Property Management",
    price: 49,
    blurb: "Per month, plus $1 per active door.",
    bullets: ["Tenants & leases", "Rent collection", "Vendors", "Maintenance requests"],
  },
  {
    name: "Eviction Hub",
    price: 199,
    blurb: "Per month. Unlimited cases. Per-jurisdiction packs.",
    bullets: ["State + county playbooks", "Deadline tracking", "Document generation", "Audit trail"],
  },
]

export default function PricingPage() {
  return (
    <>
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight">Module-based pricing</h1>
          <p className="mt-4 text-muted-foreground">
            Turn on the modules you need. Bundle discounts when you run two or more.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card key={t.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.blurb}</CardDescription>
                <div className="pt-2 text-3xl font-bold">
                  ${t.price}
                  <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-6">
                <ul className="space-y-2 text-sm">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button asChild>
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          Need an enterprise plan or a county not yet listed?{" "}
          <Link href="/contact" className="underline">Talk to us</Link>.
        </div>
      </section>
    </>
  )
}
