import type { MetadataRoute } from "next"

import { BRAND, FEATURE_AREAS } from "@/lib/brand"

/**
 * Public sitemap for marketing routes only. Tenant routes (/[slug]/...)
 * are noindex by default and excluded; the platform sitemap will be added
 * by Stream F.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const base = BRAND.url

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/products/hoa`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/products/property`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/products/eviction`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/dpa`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  const featureRoutes: MetadataRoute.Sitemap = FEATURE_AREAS.map((f) => ({
    url: `${base}/features/${f.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  return [...staticRoutes, ...featureRoutes]
}
