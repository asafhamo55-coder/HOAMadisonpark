import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductPage({
  eyebrow,
  title,
  subtitle,
  features,
  faqs,
  cta = { href: "/signup", label: "Start free" },
}: {
  eyebrow: string
  title: string
  subtitle: string
  features: { title: string; description: string }[]
  faqs?: { q: string; a: string }[]
  cta?: { href: string; label: string }
}) {
  return (
    <>
      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-primary">
            {eyebrow}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href={cta.href}>
                {cta.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20">
        <div className="container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border bg-background p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {f.title}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {faqs && faqs.length > 0 && (
        <section className="container py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Frequently asked
          </h2>
          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <div className="font-medium">{f.q}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
