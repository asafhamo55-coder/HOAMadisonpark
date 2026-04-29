import { SettingsPageHeader } from "../_components/settings-page-header"

/**
 * Integrations tab — surfaces integration availability with status pills.
 * Per DECISIONS.md: only Stripe (test mode) is wired up in v1.
 * QuickBooks / Google Workspace / SMS are dropped.
 */
const INTEGRATIONS = [
  {
    name: "Stripe",
    description:
      "Collect dues and fines online. The platform is in test mode until the first paying customer.",
    status: "Test mode",
    setupHref: "billing",
    enabled: true,
  },
  {
    name: "Resend (email)",
    description:
      "Transactional email is wired through Resend. Sender + reply-to are configured on the Email tab.",
    status: "Configured",
    setupHref: "email",
    enabled: true,
  },
  {
    name: "PostHog (product analytics)",
    description:
      "Page views and product analytics. No-op locally if NEXT_PUBLIC_POSTHOG_KEY is unset.",
    status: "Optional",
    setupHref: null,
    enabled: false,
  },
  {
    name: "QuickBooks Online",
    description:
      "Two-way accounting sync. Dropped from v1 — manual CSV export is the supported path.",
    status: "Not available",
    setupHref: null,
    enabled: false,
  },
  {
    name: "Google Workspace",
    description: "Single-sign-on and calendar sync. Coming in a later phase.",
    status: "Coming later",
    setupHref: null,
    enabled: false,
  },
  {
    name: "SMS provider",
    description:
      "Text-message notifications. Dropped from v1 — email and PWA push only.",
    status: "Not available",
    setupHref: null,
    enabled: false,
  },
]

export default function IntegrationsPage() {
  return (
    <>
      <SettingsPageHeader
        title="Integrations"
        description="Third-party services this community is connected to."
      />
      <div className="grid gap-3">
        {INTEGRATIONS.map((i) => (
          <article
            key={i.name}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {i.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{i.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  i.enabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {i.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
