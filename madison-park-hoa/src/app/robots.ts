import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://homeowner-hub.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/portal", "/hub", "/property", "/eviction", "/api"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
