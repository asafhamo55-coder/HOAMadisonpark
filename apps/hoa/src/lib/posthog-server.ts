/**
 * PostHog server-side capture (Node only).
 *
 * Lives in its own file because `posthog-node` imports node:readline /
 * node:fs, which webpack cannot bundle for the browser. Importing it from
 * any client component will fail the build — only import from server
 * actions, route handlers, and RSC.
 */

import "server-only"

import { isPostHogEnabled, POSTHOG_CONFIG } from "@/lib/posthog"

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
  if (!isPostHogEnabled() || !POSTHOG_CONFIG.key) return
  try {
    // Lazy import so the dep doesn't load when disabled.
    const { PostHog } = await import("posthog-node")
    const client = new PostHog(POSTHOG_CONFIG.key, {
      host: POSTHOG_CONFIG.host,
    })
    client.capture({
      distinctId: distinctId ?? "anon",
      event,
      properties,
    })
    await client.shutdown()
  } catch {
    // Never let analytics break a request.
  }
}
