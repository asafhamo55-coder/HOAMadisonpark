/**
 * PostHog wrapper.
 *
 * Per docs/plan/DECISIONS.md, all `posthog.capture(...)` calls must be
 * no-ops if `NEXT_PUBLIC_POSTHOG_KEY` is unset, so local development needs
 * no account.
 *
 * - On the server, we lazily import `posthog-node`.
 * - On the client, the provider component (PostHogProvider) initializes
 *   `posthog-js` once on mount and exposes the global instance via this
 *   wrapper's `captureClient` function.
 *
 * No-op when:
 *  - `NEXT_PUBLIC_POSTHOG_KEY` is not set
 *  - we are running in tests / CI without the key
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
 * Server-side capture. Uses posthog-node. Safe to call even when the SDK is
 * absent or the env key is unset — it short-circuits.
 *
 * Pass `distinctId` (the user id) when you have it, otherwise an anonymous
 * placeholder is used. Always wrap in a try/catch — analytics never fails
 * a user-facing request.
 */
export async function captureServer(
  event: string,
  distinctId: string | null,
  properties?: CaptureProps,
): Promise<void> {
  if (!isPostHogEnabled()) return
  try {
    // Lazy import so the bundle doesn't carry posthog-node when the env
    // key is unset. Static `import` would always pull the dep into the
    // serverless function bundle.
    const { PostHog } = await import("posthog-node")
    const client = new PostHog(POSTHOG_KEY!, { host: POSTHOG_HOST })
    client.capture({
      distinctId: distinctId ?? "anon",
      event,
      properties,
    })
    // Flush + shutdown — Vercel functions are short-lived.
    await client.shutdown()
  } catch {
    // Never let analytics break a request.
  }
}

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
