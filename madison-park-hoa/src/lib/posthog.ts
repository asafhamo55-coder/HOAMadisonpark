/**
 * PostHog wrapper — public, client-safe entry.
 *
 * Per docs/plan/DECISIONS.md, all `posthog.capture(...)` calls must be
 * no-ops if `NEXT_PUBLIC_POSTHOG_KEY` is unset, so local development needs
 * no account.
 *
 * This file is safe to import from BOTH client and server components. The
 * server-side capture (which depends on `posthog-node`, which pulls in
 * node:readline / node:fs) lives in `./posthog-server.ts` so the client
 * bundle never sees it.
 *
 * NEVER call posthog.capture(...) outside of these helpers.
 */

const POSTHOG_KEY =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_POSTHOG_KEY
    : undefined

const POSTHOG_HOST =
  (typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_POSTHOG_HOST
    : undefined) || "https://us.i.posthog.com"

export const isPostHogEnabled = (): boolean => Boolean(POSTHOG_KEY)

export const POSTHOG_CONFIG = {
  key: POSTHOG_KEY,
  host: POSTHOG_HOST,
}

type CaptureProps = Record<string, unknown> | undefined

/**
 * Client-side capture. Reads the global posthog instance from window if the
 * provider has initialized it. Safe to call when not initialized — no-ops.
 */
export function captureClient(event: string, properties?: CaptureProps): void {
  if (!isPostHogEnabled()) return
  if (typeof window === "undefined") return
  // The provider attaches the client lib to window.posthog when it runs.
  const w = window as unknown as {
    posthog?: {
      capture: (event: string, properties?: CaptureProps) => void
    }
  }
  try {
    w.posthog?.capture(event, properties)
  } catch {
    // Never let analytics break a UI interaction.
  }
}
