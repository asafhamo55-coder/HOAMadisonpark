import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Homeowner Hub — HOA, Property & Eviction Management",
  description:
    "Three independent SaaS products for homeowners and property managers: HOA Management Hub, Property Management, and Eviction Management.",
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
