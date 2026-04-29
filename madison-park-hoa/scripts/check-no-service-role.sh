#!/usr/bin/env bash
# ============================================================
# check-no-service-role.sh
# ============================================================
# CI guard. Fails the build if any code outside the small set of
# whitelisted files imports the Supabase service-role key OR uses
# `createAdminClient` / `createClient(..., SERVICE_ROLE_KEY)` /
# `unsafeServiceRoleClient`.
#
# Whitelisted files (the only legal places to touch service role):
#
#   src/lib/admin.ts                    — wraps every call in audit log
#   src/lib/supabase/admin.ts           — legacy client (Stream G to remove)
#   src/app/accept-invite/[token]/page.tsx — uses lib/admin.ts withAdminClient
#
#   src/app/actions/announcements.ts    | }
#   src/app/actions/documents.ts        | }
#   src/app/actions/email.ts            | }  Pre-existing single-tenant
#   src/app/actions/notifications.ts    | }  server actions. Stream G migrates
#   src/app/actions/payments.ts         | }  these to getTenantContext().
#   src/app/actions/portal.ts           | }
#   src/app/actions/properties.ts       | }  Until then they're documented as
#   src/app/actions/settings.ts         | }  legacy and grandfathered in.
#   src/app/actions/violations.ts       | }
#
# Any other file matching these patterns => build fails.
# ============================================================

set -euo pipefail

# Whitelist (paths relative to repo root or script's parent dir).
WHITELIST=(
  "src/lib/admin.ts"
  "src/lib/supabase/admin.ts"
  "src/app/accept-invite/\[token\]/page.tsx"
  "src/app/actions/announcements.ts"
  "src/app/actions/documents.ts"
  "src/app/actions/email.ts"
  "src/app/actions/notifications.ts"
  "src/app/actions/payments.ts"
  "src/app/actions/portal.ts"
  "src/app/actions/properties.ts"
  "src/app/actions/settings.ts"
  "src/app/actions/violations.ts"
)

# Patterns that indicate service-role usage.
PATTERNS=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "createAdminClient"
  "unsafeServiceRoleClient"
)

# Resolve repo root (parent of `scripts/`).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"

if [ ! -d "$SRC_DIR" ]; then
  echo "check-no-service-role: $SRC_DIR not found" >&2
  exit 1
fi

# Build a single grep pattern.
JOINED_PATTERN="$(IFS='|'; echo "${PATTERNS[*]}")"

# Build a regex that matches whitelisted paths to filter them out.
WHITELIST_REGEX="$(printf '|%s' "${WHITELIST[@]}" | sed 's|^||; s|^|(|; s|$|)|')"

violations=0
while IFS= read -r line; do
  # Format: ./src/path/to/file.ts:LINE:CONTENT
  file="${line%%:*}"
  rel="${file#./}"
  # Skip if path matches the whitelist.
  if echo "$rel" | grep -Eq "$WHITELIST_REGEX"; then
    continue
  fi
  echo "FAIL: service-role usage in $line"
  violations=$((violations + 1))
done < <(cd "$ROOT_DIR" && grep -RInE "$JOINED_PATTERN" src 2>/dev/null \
            | grep -v -E '\.test\.(ts|tsx|js|jsx)$' || true)

if [ "$violations" -ne 0 ]; then
  echo
  echo "check-no-service-role: $violations violation(s) found." >&2
  echo "Allowed paths:" >&2
  for p in "${WHITELIST[@]}"; do echo "  - $p" >&2; done
  exit 1
fi

echo "check-no-service-role: OK (no unauthorized service-role usage)"
