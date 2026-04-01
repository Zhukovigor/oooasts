import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/auth/",     // Только защищенные API
          "/api/admin/",    // Только админские API
          "/api/private/",  // Только приватные API
          "/admin/", 
          "/dashboard/",
          "/auth/",
          "/_next/",
          "/private/",
        ],
      }
    ],
    sitemap: "https://asts.vercel.app/sitemap.xml",
    host: "https://asts.vercel.app"
  }
}
