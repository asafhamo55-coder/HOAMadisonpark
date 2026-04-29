import { redirect } from "next/navigation"

import { resolvePostLoginPath } from "@/app/(auth)/actions"

/**
 * Hit immediately after a successful login (password, magic link, or OAuth)
 * to decide where the user actually goes:
 *
 *   - 0 memberships -> /onboarding
 *   - 1 membership  -> /<slug>
 *   - 2+ memberships -> /select-tenant
 *
 * Per Stream B spec. Stream A's auth callback handler points the redirect
 * here via ?next=/post-login.
 */

export const dynamic = "force-dynamic"

export default async function PostLoginPage() {
  const target = await resolvePostLoginPath()
  redirect(target)
}
