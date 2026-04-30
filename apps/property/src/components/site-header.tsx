import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const HOMEOWNER_HUB_URL =
  process.env.NEXT_PUBLIC_HOMEOWNER_HUB_URL ?? "https://homeowner-hub.app"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <a
            href={HOMEOWNER_HUB_URL}
            className="hidden items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Homeowner Hub
          </a>
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
            <span aria-hidden="true" className="inline-block h-7 w-7 rounded-md bg-emerald-600" />
            Property Management
          </Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
          <Link href="/about" className="text-sm text-slate-600 hover:text-slate-900">About</Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:text-slate-900">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:inline-block"
          >
            Demo
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  )
}
