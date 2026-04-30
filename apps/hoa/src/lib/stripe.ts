/**
 * Stripe SDK singleton + live-mode lockfile.
 *
 * Per DECISIONS.md: HOA Pro Hub runs in Stripe TEST MODE only until the LLC
 * is provisioned and the first paying customer is signed. Promoting to live
 * mode requires explicitly setting `LIVE_BILLING_ENABLED=true` AND providing
 * a `pk_live_*` publishable key — anything else throws at boot.
 *
 * Use this module everywhere instead of constructing `new Stripe(...)`.
 *
 * Required env:
 *   STRIPE_SECRET_KEY        — sk_test_... in dev, sk_live_... only with LIVE_BILLING_ENABLED
 *   STRIPE_PUBLISHABLE_KEY   — pk_test_... in dev, pk_live_... only with LIVE_BILLING_ENABLED
 *   STRIPE_WEBHOOK_SECRET    — whsec_... from `stripe listen` or the webhook endpoint dashboard
 *
 * Optional:
 *   LIVE_BILLING_ENABLED     — must be the literal string 'true' to allow live keys
 *   STRIPE_API_VERSION       — pin a Stripe API version; defaults to the SDK default
 */

import Stripe from "stripe"

const LIVE_KEY_PREFIX_PUBLISHABLE = "pk_live_"
const LIVE_KEY_PREFIX_SECRET = "sk_live_"

let cachedStripe: Stripe | null = null

/**
 * Throws if a `pk_live_*` publishable key OR a `sk_live_*` secret key is
 * configured without `LIVE_BILLING_ENABLED=true`. Called eagerly from
 * `getStripe()` so any boot-time access trips the guard.
 *
 * Per DECISIONS.md rule:
 *   "A CI check fails the build if the publishable key starts with `pk_live_`
 *    until `LIVE_BILLING_ENABLED=true` is set as an env var."
 */
export function assertLiveModeAllowed(): void {
  const liveEnabled = process.env.LIVE_BILLING_ENABLED === "true"
  if (liveEnabled) return

  const pk = process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? ""
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? ""

  if (pk.startsWith(LIVE_KEY_PREFIX_PUBLISHABLE)) {
    throw new Error(
      "[stripe] STRIPE_PUBLISHABLE_KEY is a live key (pk_live_...) but " +
        "LIVE_BILLING_ENABLED is not 'true'. Per DECISIONS.md, HOA Pro Hub " +
        "is locked to Stripe test mode until the LLC + first paying customer " +
        "are ready. Either swap to a pk_test_... key or set " +
        "LIVE_BILLING_ENABLED=true.",
    )
  }

  if (sk.startsWith(LIVE_KEY_PREFIX_SECRET)) {
    throw new Error(
      "[stripe] STRIPE_SECRET_KEY is a live key (sk_live_...) but " +
        "LIVE_BILLING_ENABLED is not 'true'. Per DECISIONS.md, swap to " +
        "sk_test_... or explicitly enable live mode.",
    )
  }
}

/**
 * Server-side Stripe SDK singleton. Lazily initialized so importing this
 * module in client bundles (which would be a bug we want to catch elsewhere)
 * doesn't crash.
 */
export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe

  assertLiveModeAllowed()

  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error(
      "[stripe] STRIPE_SECRET_KEY is not set. In test mode you can use any " +
        "sk_test_... key from the Stripe dashboard (Developers → API keys). " +
        "Until the LLC is provisioned, only test keys are accepted.",
    )
  }

  // Pin via env so we can roll forward without code changes; the SDK uses
  // its bundled default if unset. The runtime accepts any historical pinned
  // API version string, but the TS types only allow the exact LatestApiVersion
  // constant — hence the targeted cast on the apiVersion field below.
  type StripeOpts = ConstructorParameters<typeof Stripe>[1]
  const stripeOptions: StripeOpts = {
    typescript: true,
    appInfo: {
      name: "HOA Pro Hub",
      version: "0.1.0",
    },
  }
  const apiVersion = process.env.STRIPE_API_VERSION?.trim()
  if (apiVersion) {
    ;(stripeOptions as unknown as { apiVersion?: string }).apiVersion =
      apiVersion
  }
  cachedStripe = new Stripe(key, stripeOptions)

  return cachedStripe
}

/**
 * Reads the webhook signing secret. Throws clearly if missing — the webhook
 * route would fail anyway, but we want a user-friendly message.
 */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    throw new Error(
      "[stripe] STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen` " +
        "locally and copy the whsec_... it prints, or grab the secret from " +
        "the Stripe dashboard webhook endpoint.",
    )
  }
  return secret
}

/**
 * True if either the publishable or secret key is a test-mode key. Useful for
 * showing a "TEST MODE" banner in the billing UI.
 */
export function isTestMode(): boolean {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? ""
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
  return pk.startsWith("pk_test_") || sk.startsWith("sk_test_")
}

export { Stripe }
