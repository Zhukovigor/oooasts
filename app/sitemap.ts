import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://oooasts.ru"
  const supabase = createAdminClient()

  try {
    // Параллельная загрузка данных для оптимизации
    const [articlesResult, categoriesResult, modelsResult] = await Promise.all([
      // Статьи
      supabase
        .from("articles")
        .select("slug, updated_at, created_at, main_image")
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
      
      // Категории каталога
      supabase
        .from("catalog_categories")
        .select("id, slug, updated_at, created_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      
      // Модели каталога
      supabase
        .from("catalog_models")
        .select("slug, category_id, updated_at, created_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
    ])

    const articles = articlesResult.data || []
    const categories = categoriesResult.data || []
    const models = modelsResult.data || []

    // Создаем карту категорий для быстрого доступа
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    // Статические маршруты
    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/katalog`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/buy-excavators`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/komatsu-pc200`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/komatsu`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/avtobetonanosy`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/v-lizing`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/vakansii`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/o-nas`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/stati`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/politika-obrabotki-dannyh`,
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/kontakty`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/api/rss`,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.5,
      }
    ]

    // Динамические маршруты статей с поддержкой изображений
    const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => {
      const articleUrl = `${baseUrl}/stati/${article.slug}`
      const articleData: any = {
        url: articleUrl,
        lastModified: new Date(article.updated_at || article.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }

      // Добавляем изображения если есть main_image
      if (article.main_image) {
        const imageUrl = article.main_image.startsWith('http') 
          ? article.main_image 
          : `${baseUrl}${article.main_image.startsWith('/') ? '' : '/'}${article.main_image}`
        
        articleData.images = [{ url: imageUrl }]
      }

      return articleData
    })

    // Маршруты категорий
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/katalog/${category.slug}`,
      lastModified: new Date(category.updated_at || category.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    // Маршруты моделей
    const modelRoutes: MetadataRoute.Sitemap = models
      .filter((model) => model.category_id && categoryMap.has(model.category_id))
      .map((model) => {
        const category = categoryMap.get(model.category_id!)
        return {
          url: `${baseUrl}/katalog/${category!.slug}/${model.slug}`,
          lastModified: new Date(model.updated_at || model.created_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }
      })

    // Объединяем все маршруты
    const allRoutes = [
      ...staticRoutes,
      ...categoryRoutes, 
      ...modelRoutes,
      ...articleRoutes
    ]

    // Логируем для отладки (только в development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Generated sitemap with ${allRoutes.length} URLs`)
      console.log(`- Static: ${staticRoutes.length}`)
      console.log(`- Categories: ${categoryRoutes.length}`)
      console.log(`- Models: ${modelRoutes.length}`)
      console.log(`- Articles: ${articleRoutes.length}`)
      
      // Логируем статьи с изображениями
      const articlesWithImages = articleRoutes.filter(article => article.images)
      console.log(`- Articles with images: ${articlesWithImages.length}`)
    }

    return allRoutes

  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Fallback - возвращаем хотя бы статические маршруты при ошибке
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      }
    ]
  }
}
