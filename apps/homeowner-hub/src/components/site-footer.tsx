import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} Homeowner Hub. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-slate-900">About</Link>
          <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          <a href="mailto:hello@homeowner-hub.app" className="hover:text-slate-900">hello@homeowner-hub.app</a>
        </div>
      </div>
    </footer>
  )
}
