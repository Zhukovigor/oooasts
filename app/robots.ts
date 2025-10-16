import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/auth/",
        "/_next/",
      ],
    },
    sitemap: "https://asts.vercel.app/sitemap.xml",
  }
}
