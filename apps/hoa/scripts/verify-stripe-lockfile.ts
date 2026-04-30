/**
 * Verifies the live-mode lockfile in src/lib/stripe.ts.
 *
 * Run from inside madison-park-hoa/ with `npx tsx scripts/verify-stripe-lockfile.ts`.
 *
 * Asserts:
 *   1. assertLiveModeAllowed() throws when STRIPE_PUBLISHABLE_KEY starts with
 *      pk_live_ AND LIVE_BILLING_ENABLED is unset.
 *   2. It throws when STRIPE_SECRET_KEY starts with sk_live_ AND
 *      LIVE_BILLING_ENABLED is unset.
 *   3. It is a no-op when both keys are pk_test_ / sk_test_.
 *   4. It is a no-op when live keys are paired with LIVE_BILLING_ENABLED=true.
 */

import { assertLiveModeAllowed } from "../src/lib/stripe"

let failures = 0

function check(name: string, fn: () => void, shouldThrow: boolean) {
  try {
    fn()
    if (shouldThrow) {
      console.error(`FAIL — ${name}: expected throw, got success`)
      failures += 1
    } else {
      console.log(`PASS — ${name}`)
    }
  } catch (e) {
    if (shouldThrow) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log(`PASS — ${name}: threw "${msg.slice(0, 80)}…"`)
    } else {
      console.error(
        `FAIL — ${name}: unexpected throw: ${e instanceof Error ? e.message : e}`,
      )
      failures += 1
    }
  }
}

// 1. pk_live_ alone → throws
process.env.STRIPE_PUBLISHABLE_KEY = "pk_live_fake12345"
process.env.STRIPE_SECRET_KEY = "sk_test_fake"
process.env.LIVE_BILLING_ENABLED = ""
check("pk_live_ without LIVE_BILLING_ENABLED throws", assertLiveModeAllowed, true)

// 2. sk_live_ alone → throws
process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_fake"
process.env.STRIPE_SECRET_KEY = "sk_live_fake12345"
process.env.LIVE_BILLING_ENABLED = ""
check("sk_live_ without LIVE_BILLING_ENABLED throws", assertLiveModeAllowed, true)

// 3. test keys → no-op
process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_fake"
process.env.STRIPE_SECRET_KEY = "sk_test_fake"
process.env.LIVE_BILLING_ENABLED = ""
check("pk_test_/sk_test_ allowed", assertLiveModeAllowed, false)

// 4. live keys + LIVE_BILLING_ENABLED=true → no-op
process.env.STRIPE_PUBLISHABLE_KEY = "pk_live_fake"
process.env.STRIPE_SECRET_KEY = "sk_live_fake"
process.env.LIVE_BILLING_ENABLED = "true"
check("pk_live_ + LIVE_BILLING_ENABLED=true allowed", assertLiveModeAllowed, false)

// 5. LIVE_BILLING_ENABLED with non-'true' value still blocks
process.env.STRIPE_PUBLISHABLE_KEY = "pk_live_fake"
process.env.STRIPE_SECRET_KEY = "sk_live_fake"
process.env.LIVE_BILLING_ENABLED = "1"
check("LIVE_BILLING_ENABLED='1' (not 'true') still blocks", assertLiveModeAllowed, true)

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log("\nAll lockfile checks passed.")
