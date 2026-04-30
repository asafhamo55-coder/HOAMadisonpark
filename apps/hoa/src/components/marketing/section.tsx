import { cn } from "@/lib/utils"

/**
 * Centered, padded marketing section. Use for every band on a marketing page
 * so vertical rhythm stays consistent.
 */
export function Section({
  children,
  className,
  id,
  bordered,
  muted,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  bordered?: boolean
  muted?: boolean
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-24",
        bordered && "border-t border-slate-200",
        muted && "bg-slate-50",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

/**
 * Eyebrow + headline + subhead block. Pass eyebrow/title/subtitle text and
 * (optionally) an alignment.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: "center" | "left"
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-medium leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-slate-600 sm:text-lg">{subtitle}</p>
      )}
    </div>
  )
}
