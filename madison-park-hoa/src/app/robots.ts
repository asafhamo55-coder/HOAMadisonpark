import type { MetadataRoute } from "next"

import { BRAND } from "@/lib/brand"

/**
 * robots.txt — allow all marketing routes, disallow tenant workspaces and
 * platform/admin areas. The full per-tenant rules will be augmented by
 * Stream G when /[slug] routes go live.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/portal/",
          "/platform/",
          "/onboarding/",
          "/select-tenant",
          "/no-access",
          "/suspended",
          "/accept-invite/",
        ],
      },
    ],
    sitemap: `${BRAND.url}/sitemap.xml`,
    host: BRAND.url,
  }
}
