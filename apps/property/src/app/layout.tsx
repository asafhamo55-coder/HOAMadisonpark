import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Property Management — Tenants, leases, rent, maintenance",
  description:
    "Manage every property you own or operate: units, tenants, leases, rent collection, vendors, utilities, and maintenance. Part of the Homeowner Hub family.",
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
