import Link from "next/link"

import { requireTenantContext } from "@/lib/tenant"
import { SettingsTabNav } from "./_components/settings-tab-nav"

/**
 * Settings shell with sidebar tab navigation.
 *
 * All Stream E tabs live under `/[slug]/settings/<tab>`. The /billing
 * tab is rendered by Stream D but uses this same layout (so the nav
 * highlights it correctly).
 *
 * Role gating: residents are bounced to /no-access. Non-admin board /
 * committee members can see most tabs but the danger-zone, members,
 * and audit log are admin-only — the tab pages themselves enforce
 * that.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { tenantSlug, role } = await requireTenantContext()

  // Hard gate: residents/vendors/readonly cannot see settings at all.
  if (role === "resident" || role === "vendor" || role === "readonly") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-xl font-semibold text-slate-900">
          Settings are restricted
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Settings are only available to community admins, board members,
          and committee leads. If you think you should have access, ask an
          admin to update your role.
        </p>
        <Link
          href={`/${tenantSlug}`}
          className="mt-6 inline-flex items-center rounded-md bg-[var(--tenant-primary,#0F2A47)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-6 py-8">
      <aside className="w-60 shrink-0">
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Settings
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-900">
            Configure your community
          </p>
        </div>
        <SettingsTabNav slug={tenantSlug} role={role} />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
