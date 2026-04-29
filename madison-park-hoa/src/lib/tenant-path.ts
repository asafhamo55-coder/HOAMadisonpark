/**
 * Tenant path helper.
 *
 * Use this to build hrefs that include the active tenant slug, instead of
 * hard-coding "/dashboard/..." or "/portal/..." anywhere in the codebase.
 *
 *   tenantPath("madison-park", "violations")              -> "/madison-park/violations"
 *   tenantPath("madison-park", "properties", "123")        -> "/madison-park/properties/123"
 *   tenantPath("madison-park", "")                         -> "/madison-park"
 *   tenantPath("madison-park", "/violations?status=open")  -> "/madison-park/violations?status=open"
 *
 * This module has no React or runtime dependencies and can be imported from
 * server actions, RSC, client components, and tests alike.
 */

export function tenantPath(
  slug: string,
  ...segments: Array<string | number | null | undefined>
): string {
  if (!slug) {
    throw new Error("tenantPath: missing slug")
  }

  const cleanSegments: string[] = []

  for (const seg of segments) {
    if (seg === null || seg === undefined) continue
    const s = String(seg)
    if (!s) continue
    // Allow callers to pass a leading "/" — strip it so we don't end up
    // with "//".
    cleanSegments.push(s.replace(/^\/+/, "").replace(/\/+$/, ""))
  }

  const joined = cleanSegments.filter(Boolean).join("/")
  return joined ? `/${slug}/${joined}` : `/${slug}`
}
