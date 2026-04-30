import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Eviction Management — Per-jurisdiction workflow software",
  description:
    "Workflow SaaS for landlords, property managers, and eviction practitioners. State + county playbooks, deadline tracking, document generation. Part of the Homeowner Hub family.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  )
}
