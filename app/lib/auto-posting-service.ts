import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function scanAndPostNewContent() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase environment variables")
      console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓ set" : "✗ missing")
      console.log("[v0] SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓ set" : "✗ missing")
      return { success: false, message: "Supabase configuration missing" }
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    // Get Telegram settings
    const { data: settings } = await supabase.from("telegram_posting_settings").select("*").limit(1).single()

    if (!settings?.bot_token || !settings?.channel_id || !settings?.is_active) {
      console.log("[v0] Telegram posting is not configured or inactive")
      return { success: false, message: "Telegram posting not configured" }
    }

    // Get already posted content IDs
    const { data: postedContent } = await supabase.from("posted_content_tracking").select("content_type, content_id")

    const postedIds = {
      catalog: new Set<string>(),
      articles: new Set<string>(),
      // advertisements: new Set<string>(), // Убрали рекламу
    }

    postedContent?.forEach((item: any) => {
      if (postedIds[item.content_type as keyof typeof postedIds]) {
        postedIds[item.content_type as keyof typeof postedIds].add(item.content_id)
      }
    })

    let totalPosted = 0

    // 1. Scan and post new catalog models
    const { data: newCatalog } = await supabase
      .from("catalog_models")
      .select("id, name, description, main_image, created_at, slug") // Добавили slug
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10)

    for (const item of newCatalog || []) {
      if (!postedIds.catalog.has(item.id)) {
        // Используем slug для правильного URL
        const catalogUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/katalog/${item.slug}`
        
        await postToTelegram(
          {
            title: `🚗 Новое в каталоге: ${item.name}`,
            description: item.description || "Новое оборудование в нашем каталоге",
            imageUrl: item.main_image,
            postUrl: catalogUrl,
          },
          supabase,
          "catalog",
          item.id,
        )
        totalPosted++
      }
    }

    // 2. Scan and post new articles
    const { data: newArticles } = await supabase
      .from("articles")
      .select("id, title, excerpt, main_image, created_at, slug") // Добавили slug
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10)

    for (const article of newArticles || []) {
      if (!postedIds.articles.has(article.id)) {
        // Используем slug для правильного URL
        const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/stati/${article.slug}`
        
        await postToTelegram(
          {
            title: `📰 Новая статья: ${article.title}`,
            description: article.excerpt || "Новая статья на нашем сайте",
            imageUrl: article.main_image,
            postUrl: articleUrl,
          },
          supabase,
          "articles",
          article.id,
        )
        totalPosted++
      }
    }

    // 3. Рекламные баннеры УБРАНЫ

    return { success: true, totalPosted, message: `Posted ${totalPosted} new items` }
  } catch (error) {
    console.error("[v0] Error in auto-posting service:", error)
    return { success: false, message: `Error: ${error}` }
  }
}

async function postToTelegram(
  data: { title: string; description: string; imageUrl?: string; postUrl?: string },
  supabase: any,
  contentType: string,
  contentId: string,
) {
  try {
    // Используем абсолютный URL вместо относительного
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts.vercel.app"
    const response = await fetch(`${baseUrl}/api/telegram/post-to-channel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        postUrl: data.postUrl,
        // Добавляем параметры для инлайн кнопки
        withInlineButton: true,
        buttonText: "📖 Читать далее"
      }),
    })

    const result = await response.json()

    if (result.success) {
      // Save tracking record
      await supabase.from("posted_content_tracking").insert({
        content_type: contentType,
        content_id: contentId,
        telegram_message_id: result.messageId,
        status: "posted",
      })
      console.log(`[v0] Posted ${contentType}/${contentId} to Telegram`)
    } else {
      // Save error record
      await supabase.from("posted_content_tracking").insert({
        content_type: contentType,
        content_id: contentId,
        status: "failed",
        error_message: result.error,
      })
      console.error(`[v0] Failed to post ${contentType}/${contentId}:`, result.error)
    }
  } catch (error) {
    console.error(`[v0] Error posting ${contentType}/${contentId}:`, error)
  }
}
