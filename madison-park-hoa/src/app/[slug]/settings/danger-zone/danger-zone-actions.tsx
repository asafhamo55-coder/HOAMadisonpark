"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { requestDataExport } from "@/app/actions/tenant-settings"

export function DangerZoneActions() {
  const [pending, start] = useTransition()

  const onExport = () => {
    if (
      !confirm(
        "Request a full data export? You will receive an email when the export is ready.",
      )
    )
      return
    start(async () => {
      const res = await requestDataExport()
      if (res.ok) toast.success("Export request logged")
      else toast.error(res.error)
    })
  }

  return (
    <div className="space-y-4">
      <DangerCard
        title="Export all data"
        description="CSV/JSON archive of every record in this community. Useful for backups or migrating away."
      >
        <Button onClick={onExport} disabled={pending} variant="secondary">
          {pending ? "Submitting…" : "Request export"}
        </Button>
      </DangerCard>

      <DangerCard
        title="Transfer ownership"
        description="Hand the owner role to another active admin. This action requires confirmation by the new owner."
      >
        <Button
          variant="secondary"
          onClick={() =>
            toast.info(
              "Ownership transfer flow ships with Stream G's onboarding wizard.",
            )
          }
        >
          Start transfer
        </Button>
      </DangerCard>

      <DangerCard
        title="Cancel subscription"
        description="Cancels the active Stripe subscription at the end of the current billing period. Data is retained for 30 days, then anonymized."
      >
        <Button
          variant="destructive"
          onClick={() =>
            toast.info(
              "Subscription cancellation is wired up by Stream D once the Stripe webhook is deployed.",
            )
          }
        >
          Cancel subscription
        </Button>
      </DangerCard>
    </div>
  )
}

function DangerCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <article className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-rose-900">{title}</h3>
          <p className="mt-1 text-sm text-rose-800/80">{description}</p>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </article>
  )
}
