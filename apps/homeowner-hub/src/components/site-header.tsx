import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
          <span aria-hidden="true" className="inline-block h-7 w-7 rounded-md bg-[var(--primary)]" />
          Homeowner Hub
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <a href="#products" className="text-sm text-slate-600 hover:text-slate-900">Products</a>
          <Link href="/about" className="text-sm text-slate-600 hover:text-slate-900">About</Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:text-slate-900">Contact</Link>
        </nav>
        <a
          href="#wizard"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Help me pick →
        </a>
      </div>
    </header>
  )
}
