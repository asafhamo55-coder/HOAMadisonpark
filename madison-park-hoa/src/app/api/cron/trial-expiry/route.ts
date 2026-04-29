/**
 * Daily trial-expiry cron.
 *
 * Configured in vercel.json (`crons[].schedule`) to run once per day. Free
 * Hobby plan supports daily cron schedules.
 *
 * Logic per DECISIONS.md / spec:
 *   - 3 days before trial_ends_at: send warning email
 *   - 1 day  before trial_ends_at: send warning email
 *   - 0 days (trial_ends_at <= now): mark tenant.status='past_due' (read-only)
 *   - 30+ days past trial_ends_at with no upgrade: mark status='cancelled'
 *
 * Tenants that converted to a paid plan (active subscription) are skipped.
 *
 * Auth:
 *   Vercel Cron sets `Authorization: Bearer <CRON_SECRET>` if CRON_SECRET is
 *   configured. We require it in production. In dev (no CRON_SECRET set),
 *   the route is callable without auth so you can curl it locally.
 */

import { NextResponse } from "next/server"

import { withAdminClient } from "@/lib/admin"
import { sendEmail } from "@/lib/email/send"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const WARNING_WINDOWS_DAYS = [3, 1] as const
const HARD_CANCEL_AFTER_DAYS = 30

type TrialTenant = {
  id: string
  name: string
  slug: string
  status: string
  trial_ends_at: string | null
  primary_owner: string | null
}

function authIsValid(req: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) {
    // Dev convenience: no secret configured → allow.
    return true
  }
  const got = req.headers.get("authorization")?.trim()
  return got === `Bearer ${expected}`
}

function daysUntil(target: Date, from = new Date()): number {
  const diff = target.getTime() - from.getTime()
  return Math.ceil(diff / ONE_DAY_MS)
}

function isWithinSameDay(targetDays: number, todayDays: number): boolean {
  return targetDays === todayDays
}

export async function GET(req: Request): Promise<Response> {
  if (!authIsValid(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const summary = {
    warned3d: 0,
    warned1d: 0,
    expired: 0,
    hardCancelled: 0,
    skippedActive: 0,
    errors: [] as string[],
  }

  await withAdminClient(
    {
      action: "cron.trial_expiry.run",
      reason: "daily trial-expiry sweep",
      tenantId: null,
      metadata: { runAt: now.toISOString() },
    },
    async (admin) => {
      // Pull all tenants in trial / past_due states with a trial_ends_at set.
      const { data: tenants, error } = await admin
        .from("tenants")
        .select("id, name, slug, status, trial_ends_at, primary_owner")
        .in("status", ["trial", "past_due"])
        .not("trial_ends_at", "is", null)
      if (error) throw error

      for (const t of (tenants ?? []) as TrialTenant[]) {
        try {
          await processTenant(admin, t, now, summary)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          summary.errors.push(`${t.id}: ${msg}`)
          console.error(
            `[cron.trial_expiry] tenant ${t.id} (${t.slug}) failed:`,
            msg,
          )
        }
      }
    },
  )

  return NextResponse.json({
    ok: true,
    runAt: now.toISOString(),
    summary,
  })
}

// Allow Vercel Cron to use POST too (it can be configured either way).
export const POST = GET

async function processTenant(
  admin: import("@supabase/supabase-js").SupabaseClient,
  t: TrialTenant,
  now: Date,
  summary: {
    warned3d: number
    warned1d: number
    expired: number
    hardCancelled: number
    skippedActive: number
    errors: string[]
  },
): Promise<void> {
  if (!t.trial_ends_at) return

  // If they have an active subscription, skip — they've converted.
  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("tenant_id", t.id)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle()

  if (activeSub) {
    summary.skippedActive += 1
    return
  }

  const trialEnd = new Date(t.trial_ends_at)
  const daysToEnd = daysUntil(trialEnd, now)

  // Hard cancellation after 30 days past the end with no upgrade.
  const daysPastEnd = -daysToEnd
  if (t.status === "past_due" && daysPastEnd >= HARD_CANCEL_AFTER_DAYS) {
    const { error } = await admin
      .from("tenants")
      .update({ status: "cancelled" })
      .eq("id", t.id)
    if (error) throw error
    summary.hardCancelled += 1
    return
  }

  // Day-of expiry (or any time after, for tenants stuck in 'trial'): flip
  // to past_due so the app shows a paywall while still allowing reads.
  if (daysToEnd <= 0 && t.status === "trial") {
    const { error } = await admin
      .from("tenants")
      .update({ status: "past_due" })
      .eq("id", t.id)
    if (error) throw error
    summary.expired += 1
    await emailOwner(admin, t, {
      subject: "Your HOA Pro Hub trial has ended",
      body:
        `Hi,\n\nYour 14-day trial for ${t.name} ended on ${trialEnd.toDateString()}. ` +
        `Your account is now in read-only mode. Upgrade any time to restore full access.\n\n` +
        `No data has been deleted. After 30 days the account will be cancelled if no plan is selected.`,
      ctaLabel: "Choose a plan",
      ctaUrl: `/${t.slug}/settings/billing`,
    })
    return
  }

  // Warning windows (only fire while still in 'trial').
  if (t.status !== "trial") return

  for (const win of WARNING_WINDOWS_DAYS) {
    if (isWithinSameDay(daysToEnd, win)) {
      await emailOwner(admin, t, {
        subject: `Your HOA Pro Hub trial ends in ${win} day${win === 1 ? "" : "s"}`,
        body:
          `Hi,\n\nYour trial for ${t.name} ends on ${trialEnd.toDateString()} ` +
          `(${win} day${win === 1 ? "" : "s"} from today). ` +
          `Pick a plan now to keep full access without interruption.`,
        ctaLabel: "Choose a plan",
        ctaUrl: `/${t.slug}/settings/billing`,
      })
      if (win === 3) summary.warned3d += 1
      if (win === 1) summary.warned1d += 1
    }
  }
}

async function emailOwner(
  admin: import("@supabase/supabase-js").SupabaseClient,
  t: TrialTenant,
  message: { subject: string; body: string; ctaLabel: string; ctaUrl: string },
): Promise<void> {
  // Resolve the primary owner's email via the auth admin API (service role
  // can read auth.users via auth.admin, not via PostgREST).
  let ownerEmail: string | null = null

  if (t.primary_owner) {
    const { data: u } = await admin.auth.admin.getUserById(t.primary_owner)
    ownerEmail = u?.user?.email ?? null
  }

  if (!ownerEmail) {
    // Fallback: first active owner-role member.
    const { data: memberships } = await admin
      .from("tenant_memberships")
      .select("user_id")
      .eq("tenant_id", t.id)
      .eq("role", "owner")
      .eq("status", "active")
      .limit(1)
    const userId = memberships?.[0]?.user_id
    if (userId) {
      const { data: u } = await admin.auth.admin.getUserById(userId)
      ownerEmail = u?.user?.email ?? null
    }
  }

  if (!ownerEmail) {
    console.warn(
      `[cron.trial_expiry] no owner email for tenant ${t.id} (${t.slug})`,
    )
    return
  }

  // Build absolute URL for the CTA. We don't have a per-request origin in a
  // cron context, so honour PUBLIC_APP_URL / VERCEL_URL.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://hoaprohub.app")
  const absCta = message.ctaUrl.startsWith("http")
    ? message.ctaUrl
    : `${origin}${message.ctaUrl}`

  try {
    await sendEmail({
      to: ownerEmail,
      subject: message.subject,
      template: "general-announcement",
      props: {
        subject: message.subject,
        body: message.body,
        ctaLabel: message.ctaLabel,
        ctaUrl: absCta,
        fromName: "HOA Pro Hub",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    })
  } catch (err) {
    // Email failures should not block the status updates. Log + continue.
    console.error(
      `[cron.trial_expiry] sendEmail failed for ${t.slug}:`,
      err instanceof Error ? err.message : err,
    )
  }
}
