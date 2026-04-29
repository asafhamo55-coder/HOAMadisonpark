"use client"

/**
 * Tenant context provider.
 *
 * Wraps the [slug] segment so every client component below it can read the
 * active tenant id, slug, role, and tenant name without prop-drilling.
 *
 * The provider is rendered from `app/[slug]/layout.tsx`, which is a server
 * component that pulls the tenant context from the request headers (set by
 * middleware.ts) via `getTenantContext()`.
 *
 * Use the `useTenant()` hook (or the more specific `useTenantSlug()`) from
 * any client component beneath the provider.
 */

import { createContext, useContext, type ReactNode } from "react"

import type { TenantRole } from "@/lib/tenant"

export type TenantClientContext = {
  tenantId: string
  slug: string
  role: TenantRole
  tenantName: string
}

const TenantCtx = createContext<TenantClientContext | null>(null)

export function TenantProvider({
  value,
  children,
}: {
  value: TenantClientContext
  children: ReactNode
}) {
  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>
}

/**
 * Returns the full tenant context. Throws if called outside of a
 * <TenantProvider>. Use this when you need more than just the slug.
 */
export function useTenant(): TenantClientContext {
  const ctx = useContext(TenantCtx)
  if (!ctx) {
    throw new Error(
      "useTenant() must be used inside a <TenantProvider>. " +
        "This typically means the component is rendered above app/[slug]/layout.tsx.",
    )
  }
  return ctx
}

/**
 * Convenience hook — returns just the active tenant slug, suitable for
 * building hrefs with tenantPath().
 */
export function useTenantSlug(): string {
  return useTenant().slug
}

/**
 * Returns the tenant slug if a provider is mounted, or null otherwise.
 * Useful for shared components that may render in either single-tenant or
 * multi-tenant contexts during the migration.
 */
export function useOptionalTenantSlug(): string | null {
  const ctx = useContext(TenantCtx)
  return ctx?.slug ?? null
}
