import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Ревалидация каждый час
export const revalidate = 3600

function escapeXml(unsafe: string): string {
  if (!unsafe) return ""

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function htmlToDzenFormat(html: string, mainImage?: string, baseUrl?: string): string {
  if (!html) return ""

  let text = html
    // Сохраняем эмодзи и специальные символы
    .replace(/🏗️/g, "🏗️")
    .replace(/🚜/g, "🚜")
    .replace(/✅/g, "✅")
    .replace(/💬/g, "💬")
    .replace(/💰/g, "💰")
    .replace(/⚡/g, "⚡")
    .replace(/🛠️/g, "🛠️")

    // Конвертируем заголовки
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "<h1>$1</h1>")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "<h2>$1</h2>")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "<h3>$1</h3>")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "<h4>$1</h4>")
    .replace(/<h[5-6][^>]*>(.*?)<\/h[5-6]>/gi, "<h4>$1</h4>")

    // Форматирование текста
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "<b>$1</b>")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "<i>$1</i>")
    .replace(/<u[^>]*>(.*?)<\/u>/gi, "<u>$1</u>")
    .replace(/<s[^>]*>(.*?)<\/s>/gi, "<s>$1</s>")
    .replace(/<strike[^>]*>(.*?)<\/strike>/gi, "<s>$1</s>")

    // Обработка изображений - конвертируем в figure с img
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, (match, src, alt) => {
      const fullSrc = src.startsWith("http") ? src : `${baseUrl}${src.startsWith("/") ? "" : "/"}${src}`
      return `<figure><img src="${fullSrc}"/><figcaption>${alt || ""}</figcaption></figure>`
    })
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
      const fullSrc = src.startsWith("http") ? src : `${baseUrl}${src.startsWith("/") ? "" : "/"}${src}`
      return `<figure><img src="${fullSrc}"/></figure>`
    })

    // Списки
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const listItems = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      const formattedItems = listItems.map((item) => item.replace(/<li[^>]*>(.*?)<\/li>/i, "<li>$1</li>")).join("")
      return `<ul>${formattedItems}</ul>`
    })

    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      const listItems = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      const formattedItems = listItems.map((item) => item.replace(/<li[^>]*>(.*?)<\/li>/i, "<li>$1</li>")).join("")
      return `<ol>${formattedItems}</ol>`
    })

    // Цитаты
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "<blockquote>$1</blockquote>")

    // Ссылки
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '<a href="$1">$2</a>')

    // Абзацы
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "<p>$1</p>")
    .replace(/<div[^>]*>(.*?)<\/div>/gi, "<p>$1</p>")
    .replace(/<br\s*\/?>/gi, "<br/>")

    // Удаляем неподдерживаемые теги
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<form[^>]*>.*?<\/form>/gi, "")
    .replace(/<button[^>]*>.*?<\/button>/gi, "")
    .replace(/<input[^>]*>/gi, "")

    // Очищаем лишние пробелы
    .replace(/\s+/g, " ")
    .trim()

  if (mainImage && !text.includes(mainImage)) {
    const fullImageUrl = mainImage.startsWith("http")
      ? mainImage
      : `${baseUrl}${mainImage.startsWith("/") ? "" : "/"}${mainImage}`
    text = `<figure><img src="${fullImageUrl}"/></figure>${text}`
  }

  return text
}

function createBeautifulExcerpt(html: string, maxLength = 150): string {
  if (!html) return ""

  let text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (text.length > maxLength) {
    text = text.substring(0, maxLength)
    const lastSpace = text.lastIndexOf(" ")
    if (lastSpace > 0) {
      text = text.substring(0, lastSpace)
    }
    text += "..."
  }

  return text
}

async function getImageSize(url: string): Promise<number> {
  return 102400 // 100KB в байтах
}

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .gte("published_at", threeDaysAgo.toISOString())
      .order("published_at", { ascending: false })
      .limit(500) // Zen limit

    if (error) {
      console.error("Ошибка при получении статей:", error)
      return new NextResponse("Ошибка при получении статей", { status: 500 })
    }

    if (!articles || articles.length < 10) {
      console.warn(`ВНИМАНИЕ: Для Дзена нужно минимум 10 статей. Сейчас: ${articles?.length || 0}`)
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts.vercel.app"
    const currentUrl = new URL(request.url)
    const rssUrl = `${currentUrl.origin}${currentUrl.pathname}`

    const rssItems = await Promise.all(
      articles?.map(async (article) => {
        const articleUrl = `${baseUrl}/stati/${article.slug}`
        const mobileUrl = articleUrl // Same URL, responsive design

        const pubDate = new Date(article.published_at).toUTCString()

        const beautifulExcerpt = createBeautifulExcerpt(article.excerpt || article.content || "")

        const dzenFormattedContent = htmlToDzenFormat(
          article.content || article.excerpt || "",
          article.main_image,
          baseUrl,
        )

        const contentLength = dzenFormattedContent.replace(/<[^>]*>/g, "").length
        if (contentLength < 300) {
          console.warn(
            `Статья "${article.title}" содержит менее 300 символов (${contentLength}). Дзен может отклонить.`,
          )
        }

        let enclosureContent = ""

        if (article.main_image) {
          const imageUrl = article.main_image.startsWith("http")
            ? article.main_image
            : `${baseUrl}${article.main_image.startsWith("/") ? "" : "/"}${article.main_image}`

          const imageSize = await getImageSize(imageUrl)
          enclosureContent = `
        <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="${imageSize}"/>`
        }

        const guid = article.id

        return `    <item>
        <title>${escapeXml(article.title || "")}</title>
        <link>${escapeXml(articleUrl)}</link>
        <pdalink>${escapeXml(mobileUrl)}</pdalink>
        <guid>${escapeXml(guid)}</guid>
        <pubDate>${pubDate}</pubDate>
        <media:rating scheme="urn:simple">nonadult</media:rating>
        <category>format-article</category>
        <category>index</category>
        <category>comment-all</category>${enclosureContent}
        <description>${escapeXml(beautifulExcerpt)}</description>
        <content:encoded><![CDATA[${dzenFormattedContent}]]></content:encoded>
      </item>`
      }) || [],
    )

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:georss="http://www.georss.org/georss">
  <channel>
    <title>ООО АСТС</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Актуальные статьи и новости о спецтехнике, экскаваторах, автобетононасосах и строительном оборудовании от компании АСТС</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(rssUrl)}" rel="self" type="application/rss+xml"/>
${rssItems.join("\n")}
  </channel>
</rss>`

    return new NextResponse(rss, {
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
