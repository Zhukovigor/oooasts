import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://oooasts.ru"

  const supabase = createAdminClient()

  // Get all published articles
  const { data: articles } = await supabase.from("articles").select("slug, updated_at").eq("status", "published")

  // Get all active catalog categories
  const { data: categories } = await supabase
    .from("catalog_categories")
    .select("slug, updated_at")
    .eq("is_active", true)

  // Get all active catalog models
  const { data: models } = await supabase
    .from("catalog_models")
    .select("slug, category_id, updated_at")
    .eq("is_active", true)

  // Get category slugs for model URLs
  const { data: categoryData } = await supabase.from("catalog_categories").select("id, slug")

  const categoryMap = new Map(categoryData?.map((c) => [c.id, c.slug]) || [])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/katalog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/buy-excavators`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/komatsu-pc200`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/komatsu`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/avtobetonanosy`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/v-lizing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vakansii`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/o-nas`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stati`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/politika-obrabotki-dannyh`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  const articleRoutes: MetadataRoute.Sitemap = (articles || []).map((article) => ({
    url: `${baseUrl}/stati/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${baseUrl}/katalog/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const modelRoutes: MetadataRoute.Sitemap = (models || [])
    .filter((model) => model.category_id && categoryMap.has(model.category_id))
    .map((model) => ({
      url: `${baseUrl}/katalog/${categoryMap.get(model.category_id)}/${model.slug}`,
      lastModified: new Date(model.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }))

  return [...staticRoutes, ...categoryRoutes, ...modelRoutes, ...articleRoutes]
}
