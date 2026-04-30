import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://homeowner-hub.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    "",
    "/products/hoa",
    "/products/property",
    "/products/eviction",
    "/pricing",
    "/about",
    "/contact",
    "/legal/terms",
    "/legal/privacy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }))
}
