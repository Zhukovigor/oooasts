import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Ревалидация каждый час
export const revalidate = 3600

// Улучшенная функция для экранирования специальных XML-символов
function escapeXml(unsafe: string): string {
  if (!unsafe) return ""
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Функция для удаления HTML-тегов из контента
function stripHtml(html: string): string {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "")
}

// Функция для гарантии правильного кодирования всех амперсандов во всём XML
function sanitizeXmlContent(xml: string): string {
  // Находим все неэкранированные амперсанды, которые не являются частью XML-сущностей
  return xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, "&amp;")
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Получаем опубликованные статьи, отсортированные по дате публикации
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Ошибка при получении статей:", error)
      return new NextResponse("Ошибка при получении статей", { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts.vercel.app"

    // Генерируем RSS-ленту
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:yandex="http://news.yandex.ru" 
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml("ООО «АСТС» - Статьи и новости")}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml("Актуальные статьи и новости о спецтехнике, экскаваторах, автобетононасосах и строительном оборудовании от компании АСТС")}</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${articles
  ?.map((article) => {
    const articleUrl = `${baseUrl}/stati/${article.slug}`
    const pubDate = new Date(article.published_at).toUTCString()

    // Очищаем контент для полного текста (удаляем HTML-теги)
    const fullText = article.content ? stripHtml(article.content) : article.excerpt || ""

    // Гарантируем правильное форматирование URL изображения
    let mediaContent = ""
    if (article.main_image) {
      const imageUrl = article.main_image.startsWith("http") 
        ? article.main_image 
        : `${baseUrl}${article.main_image.startsWith("/") ? "" : "/"}${article.main_image}`
      
      mediaContent = `
      <media:group>
        <media:content url="${escapeXml(imageUrl)}" type="image/jpeg"/>
        <media:thumbnail url="${escapeXml(imageUrl)}"/>
      </media:group>`
    }

    return `    <item>
      <title>${escapeXml(article.title || "")}</title>
      <link>${escapeXml(articleUrl)}</link>
      <description>${escapeXml(article.excerpt || "")}</description>
      <author>${escapeXml(article.author || "ООО «АСТС»")}</author>
      <category>${escapeXml(article.category || "Статьи")}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <yandex:genre>message</yandex:genre>
      <yandex:full-text>${escapeXml(fullText)}</yandex:full-text>${mediaContent}
    </item>`
  })
  .join("\n")}
  </channel>
</rss>`

    // Применяем финальную санитизацию для обработки оставшихся неэкранированных амперсандов
    const sanitizedRss = sanitizeXmlContent(rss)

    return new NextResponse(sanitizedRss, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error) {
    console.error("Ошибка при генерации RSS-ленты:", error)
    return new NextResponse("Ошибка при генерации RSS-ленты", { status: 500 })
  }
}
