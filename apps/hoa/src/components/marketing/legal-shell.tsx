import { AlertTriangle } from "lucide-react"

/**
 * Wrapper for legal pages — terms, privacy, DPA. Provides the
 * "draft, lawyer review pending" banner and a typography wrapper sized
 * for long-form prose.
 */
export function LegalShell({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="flex items-start gap-2">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 flex-none text-amber-600"
            aria-hidden="true"
          />
          <span>
            <strong>Draft — lawyer review pending.</strong> This document is
            placeholder copy for development purposes only. The final version
            will be reviewed by counsel before launch and may differ
            materially. Do not rely on this version for legal compliance.
          </span>
        </p>
      </div>

      <h1 className="mt-10 font-display text-4xl font-medium tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Effective: {effectiveDate}
      </p>

      <div className="prose prose-slate mt-8 max-w-none text-slate-700 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        {children}
      </div>
    </div>
  )
}
