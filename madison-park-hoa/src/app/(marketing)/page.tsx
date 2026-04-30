import Link from "next/link"
import {
  ArrowRight,
  Building,
  Building2,
  Gavel,
  CheckCircle2,
  Users,
  Wrench,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadForm } from "@/components/marketing/lead-form"

export default function HomePage() {
  return (
    <>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Trusted by homeowners and managers
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            One hub for everything you own.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Homeowner Hub gives you HOA management, full property management, and
            jurisdiction-aware eviction workflows — under a single account.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#products">Explore products</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="products" className="container pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <ProductCard
            href="/products/hoa"
            icon={<Building2 className="h-6 w-6" />}
            title="HOA Hub"
            description="Run your homeowners association — properties, residents, violations, payments, announcements, and the resident portal."
            bullets={["Resident portal", "Violations & fines", "Online payments", "Board tools"]}
          />
          <ProductCard
            href="/products/property"
            icon={<Building className="h-6 w-6" />}
            title="Property Management"
            description="Manage every property you own or operate: tenants, leases, rent collection, vendors, utilities, and maintenance."
            bullets={["Tenants & leases", "Rent & utilities", "Vendor jobs", "Maintenance"]}
          />
          <ProductCard
            href="/products/eviction"
            icon={<Gavel className="h-6 w-6" />}
            title="Eviction Hub"
            description="Stage-by-stage eviction workflow tailored per state and county. Notices, deadlines, filings, and outcomes — without the spreadsheet."
            bullets={["State + county playbooks", "Deadline tracking", "Document generation", "Audit trail"]}
          />
        </div>
      </section>

      <section className="border-y bg-muted/30 py-20">
        <div className="container grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Why Homeowner Hub</h2>
            <p className="mt-4 text-muted-foreground">
              Most homeowners stitch together five tools. We built one workspace
              that scales from your first rental to a 200-door portfolio — with
              the legal-grade rigor eviction demands.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Single sign-on across HOA, property, and eviction modules",
                "Jurisdiction-aware eviction templates (state + county)",
                "Role-based access for owners, managers, and board members",
                "Cancel any time — modules billed independently",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FeatureTile icon={<Users className="h-5 w-5" />} label="Tenants & residents" />
            <FeatureTile icon={<Wrench className="h-5 w-5" />} label="Maintenance" />
            <FeatureTile icon={<Gavel className="h-5 w-5" />} label="Legal workflows" />
            <FeatureTile icon={<ShieldCheck className="h-5 w-5" />} label="Audit trail" />
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Talk to us</h2>
          <p className="mt-3 text-muted-foreground">
            Tell us about your portfolio. We&apos;ll show you the right setup.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <LeadForm />
        </div>
      </section>
    </>
  )
}

function ProductCard({
  href,
  icon,
  title,
  description,
  bullets,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  bullets: string[]
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-6">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              {b}
            </li>
          ))}
        </ul>
        <Button variant="outline" asChild>
          <Link href={href}>
            Learn more <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function FeatureTile({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
      <div className="text-primary">{icon}</div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  )
}
