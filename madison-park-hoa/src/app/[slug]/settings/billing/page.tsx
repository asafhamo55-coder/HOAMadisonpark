import Link from "next/link"

import { requireTenantContext } from "@/lib/tenant"
import { SettingsPageHeader } from "../_components/settings-page-header"

/**
 * Placeholder for the billing tab.
 *
 * Stream D owns the actual billing content (plan picker, invoices,
 * payment method, seat usage, etc.). Stream E only owns the layout,
 * so this file ships a friendly placeholder. Stream D will replace
 * the body of this page in their PR.
 */
export default async function BillingPlaceholderPage() {
  const { role } = await requireTenantContext()

  if (role !== "owner" && role !== "admin") {
    return (
      <p className="text-sm text-slate-600">
        Billing is restricted to owners and admins.
      </p>
    )
  }

  return (
    <>
      <SettingsPageHeader
        title="Billing"
        description="Plan, payment method, invoices, and seat usage."
      />
      <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-600">
          Stream D ships the billing UI here — plan picker, payment method,
          invoices, and seat usage. Until then, this tab is a placeholder.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          (Stripe is in test mode until the first paying customer per
          DECISIONS.md.)
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Looking for the legacy single-tenant{" "}
          <Link
            href="/dashboard/settings"
            className="font-medium underline hover:text-slate-700"
          >
            Settings
          </Link>
          ? It will be retired by Stream G.
        </p>
      </div>
    </>
  )
}
