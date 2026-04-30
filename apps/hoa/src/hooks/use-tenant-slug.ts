/**
 * use-tenant-slug — convenience hook re-exports.
 *
 * The full tenant context lives in `@/components/tenant-provider`. This file
 * exists so call sites can `import { useTenantSlug } from "@/hooks/use-tenant-slug"`
 * to follow the project's hook-naming convention without dragging in the
 * provider's other exports.
 *
 * Use this wherever you build internal links via `tenantPath(slug, ...)`.
 */

export {
  useTenant,
  useTenantSlug,
  useOptionalTenantSlug,
  type TenantClientContext,
} from "@/components/tenant-provider"
