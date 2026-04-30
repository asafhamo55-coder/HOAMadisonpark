"use client"

import { useEffect } from "react"

import { POSTHOG_CONFIG, isPostHogEnabled } from "@/lib/posthog"

/**
 * Initialize the PostHog browser SDK once when the marketing/app shell mounts.
 *
 * Only runs if `NEXT_PUBLIC_POSTHOG_KEY` is set. On every other environment
 * (local dev without an account, preview branches without secrets, CI builds)
 * this component renders nothing and runs no script.
 *
 * After init we attach the SDK to `window.posthog` so the lightweight
 * `captureClient` wrapper from `lib/posthog.ts` can find it without coupling
 * every component to the heavy posthog-js dependency.
 */
export function PostHogProvider() {
  useEffect(() => {
    if (!isPostHogEnabled()) return
    let cancelled = false

    ;(async () => {
      try {
        const mod = await import("posthog-js")
        if (cancelled) return
        const posthog = mod.default
        if (!POSTHOG_CONFIG.key) return
        posthog.init(POSTHOG_CONFIG.key, {
          api_host: POSTHOG_CONFIG.host,
          capture_pageview: true,
          capture_pageleave: true,
          person_profiles: "identified_only",
        })
        // Expose for captureClient(...) wrapper.
        ;(
          window as unknown as { posthog: typeof posthog }
        ).posthog = posthog
      } catch {
        // Swallow — analytics is never load-bearing.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
