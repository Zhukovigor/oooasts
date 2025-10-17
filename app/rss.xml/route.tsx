import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch published articles, ordered by published date
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50) // Limit to last 50 articles

    if (error) {
      console.error("[v0] RSS feed error:", error)
      return new Response("Error generating RSS feed", { status: 500 })
    }

    // Get site URL from environment or use default
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts-nsk.ru"

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss 
  xmlns:yandex="http://news.yandex.ru" 
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  version="2.0">
  <channel>
    <title>ООО «АСТС» - Статьи и новости</title>
    <link>${siteUrl}</link>
    <description>Новости, статьи и обзоры о спецтехнике, экскаваторах, автобетононасосах и строительном оборудовании от компании АСТС</description>
    <language>ru</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${articles
      ?.map((article) => {
        const articleUrl = `${siteUrl}/stati/${article.slug}`
        const pubDate = article.published_at
          ? new Date(article.published_at).toUTCString()
          : new Date(article.created_at).toUTCString()

        // Escape XML special characters
        const escapeXml = (str: string) => {
          if (!str) return ""
          return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")
        }

        const title = escapeXml(article.title || "")
        const description = escapeXml(article.excerpt || article.content?.substring(0, 300) || "")
        const author = escapeXml(article.author || "Редакция АСТС")
        const category = escapeXml(article.category || "Статьи")
        const content = escapeXml(article.content?.substring(0, 1000) || description)

        return `
    <item>
      <title>${title}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description>${description}</description>
      <author>${author}</author>
      <category>${category}</category>
      ${
        article.main_image
          ? `<media:content url="${siteUrl}${article.main_image}" type="image/jpeg"/>
      <media:thumbnail url="${siteUrl}${article.main_image}"/>`
          : ""
      }
      <pubDate>${pubDate}</pubDate>
      <yandex:genre>article</yandex:genre>
      <yandex:full-text>${content}</yandex:full-text>
    </item>`
      })
      .join("")}
  </channel>
</rss>`

    return new Response(rssXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("[v0] RSS feed generation error:", error)
    return new Response("Error generating RSS feed", { status: 500 })
  }
}
